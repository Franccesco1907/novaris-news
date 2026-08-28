import { createHash } from "node:crypto";

import {
  ADMISSION_OUTCOME,
  EVIDENCE_PACKAGE_ASSEMBLY_REASON,
  EVIDENCE_TIER,
  PROVENANCE_STATUS,
  RIGHTS_STATUS,
  TOPIC,
  evidenceAdmissionDecisionSchema,
  evidencePackageAssemblyInputSchema,
  evidencePackageSchema,
  type EvidenceAdmissionDecision,
  type EvidenceAdmissionInput,
  type EvidenceDocumentSnapshot,
  type EvidencePackageAssemblyInput,
  type EvidencePackageAssemblyReason,
  type EvidencePackageAssemblyResult,
  type EvidencePackageSerializationResult,
  type OriginGraph,
} from "@novaris/shared-contracts";

export interface EvidenceAdmissionEvaluator {
  evaluate(input: EvidenceAdmissionInput): EvidenceAdmissionDecision;
}

function failure(
  reasonCode: EvidencePackageAssemblyReason,
): EvidencePackageAssemblyResult {
  return { status: "error", reasonCode };
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function normalizeDecision(
  input: unknown,
): EvidenceAdmissionDecision | undefined {
  const parsed = evidenceAdmissionDecisionSchema.safeParse(input);
  if (!parsed.success) return undefined;

  return {
    ...parsed.data,
    reasonCodes: [...parsed.data.reasonCodes].sort(compareText),
  };
}

function canonicalJson(value: unknown): string {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("Canonical JSON requires finite numbers");
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => compareText(left, right),
    );
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }

  throw new TypeError("Unsupported canonical JSON value");
}

function fingerprint(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value))
    return value;

  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }

  return Object.freeze(value);
}

function hasDuplicate<T>(
  values: readonly T[],
  identity: (value: T) => string,
): boolean {
  const identities = new Set<string>();
  for (const value of values) {
    const key = identity(value);
    if (identities.has(key)) return true;
    identities.add(key);
  }
  return false;
}

function compareAdmissionEvidence(
  admission: EvidenceAdmissionInput,
  documents: readonly EvidenceDocumentSnapshot[],
): boolean {
  if (admission.evidence.length !== documents.length) return false;
  const documentsById = new Map(
    documents.map((document) => [document.documentId, document]),
  );

  return admission.evidence.every((record) => {
    const document = documentsById.get(record.documentId);
    return (
      document !== undefined &&
      document.tier === record.tier &&
      document.originGroup === record.originGroup &&
      document.rightsSnapshot.status === record.rightsStatus &&
      document.provenanceSnapshot.status === record.provenanceStatus &&
      document.inRemit === record.inRemit &&
      document.current === record.current &&
      document.materiallyContradicted === record.materiallyContradicted
    );
  });
}

interface ValidOriginGraph {
  terminalByDocumentId: Map<string, string>;
}

function validateOriginGraph(
  graph: OriginGraph,
  documents: readonly EvidenceDocumentSnapshot[],
): ValidOriginGraph | undefined {
  const nodeIds = new Set(graph.nodes.map((node) => node.originId));
  const parentsByNode = new Map<string, string[]>();

  for (const edge of graph.edges) {
    if (
      !nodeIds.has(edge.fromOriginId) ||
      !nodeIds.has(edge.derivesFromOriginId)
    ) {
      return undefined;
    }
    const parents = parentsByNode.get(edge.fromOriginId) ?? [];
    parents.push(edge.derivesFromOriginId);
    parentsByNode.set(edge.fromOriginId, parents);
  }

  if ([...parentsByNode.values()].some((parents) => parents.length !== 1))
    return undefined;

  const terminalByNode = new Map<string, string>();
  const resolving = new Set<string>();
  const resolveTerminal = (originId: string): string | undefined => {
    const cached = terminalByNode.get(originId);
    if (cached !== undefined) return cached;
    if (resolving.has(originId)) return undefined;

    resolving.add(originId);
    const parent = parentsByNode.get(originId)?.[0];
    const terminal = parent === undefined ? originId : resolveTerminal(parent);
    resolving.delete(originId);
    if (terminal !== undefined) terminalByNode.set(originId, terminal);
    return terminal;
  };

  for (const nodeId of nodeIds) {
    if (resolveTerminal(nodeId) === undefined) return undefined;
  }

  const terminalByDocumentId = new Map<string, string>();
  for (const document of documents) {
    if (!nodeIds.has(document.originNodeId)) return undefined;
    const terminal = terminalByNode.get(document.originNodeId);
    if (terminal === undefined || terminal !== document.originGroup)
      return undefined;
    terminalByDocumentId.set(document.documentId, terminal);
  }

  return { terminalByDocumentId };
}

function hasIndependentCurrentAffairsPair(
  documents: readonly EvidenceDocumentSnapshot[],
  terminalByDocumentId: ReadonlyMap<string, string>,
): boolean {
  const authorityRoots = documents
    .filter((document) => document.tier === EVIDENCE_TIER.AUTHORITY)
    .map((document) => terminalByDocumentId.get(document.documentId));
  const corroboratorRoots = documents
    .filter((document) => document.tier === EVIDENCE_TIER.CORROBORATOR)
    .map((document) => terminalByDocumentId.get(document.documentId));

  return authorityRoots.some((authorityRoot) =>
    corroboratorRoots.some(
      (corroboratorRoot) =>
        authorityRoot !== undefined &&
        corroboratorRoot !== undefined &&
        authorityRoot !== corroboratorRoot,
    ),
  );
}

function sortAssemblyCollections(
  input: EvidencePackageAssemblyInput,
): EvidencePackageAssemblyInput {
  input.admission.suppliedDecision.reasonCodes.sort(compareText);
  input.admission.input.evidence.sort((left, right) =>
    compareText(left.documentId, right.documentId),
  );
  input.documents.sort((left, right) =>
    compareText(left.documentId, right.documentId),
  );
  input.originGraph.nodes.sort((left, right) =>
    compareText(left.originId, right.originId),
  );
  input.originGraph.edges.sort((left, right) =>
    compareText(canonicalJson(left), canonicalJson(right)),
  );
  input.claims.sort((left, right) => compareText(left.claimId, right.claimId));
  input.claimEvidenceLinks.sort((left, right) =>
    compareText(canonicalJson(left), canonicalJson(right)),
  );
  return input;
}

export function assembleEvidencePackage(
  input: unknown,
  evaluator: EvidenceAdmissionEvaluator,
): EvidencePackageAssemblyResult {
  const parsed = evidencePackageAssemblyInputSchema.safeParse(input);
  if (!parsed.success)
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.CANONICALIZATION_FAILURE);
  const assembly = parsed.data;

  let reevaluatedOutput: unknown;
  try {
    reevaluatedOutput = evaluator.evaluate(
      structuredClone(assembly.admission.input),
    );
  } catch {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.CANONICALIZATION_FAILURE);
  }

  const reevaluated = normalizeDecision(reevaluatedOutput);
  if (reevaluated === undefined) {
    return failure(
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.INVALID_ADMISSION_EVALUATOR_OUTPUT,
    );
  }
  const suppliedDecision = normalizeDecision(
    assembly.admission.suppliedDecision,
  );
  if (suppliedDecision === undefined) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.CANONICALIZATION_FAILURE);
  }

  if (canonicalJson(reevaluated) !== canonicalJson(suppliedDecision)) {
    return failure(
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.ADMISSION_DECISION_MISMATCH,
    );
  }
  if (reevaluated.outcome !== ADMISSION_OUTCOME.ELIGIBLE) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.ADMISSION_NOT_ELIGIBLE);
  }

  if (
    hasDuplicate(
      assembly.admission.input.evidence,
      (record) => record.documentId,
    ) ||
    hasDuplicate(assembly.documents, (document) => document.documentId)
  ) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_DOCUMENT_ID);
  }
  if (hasDuplicate(assembly.claims, (claim) => claim.claimId)) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_CLAIM_ID);
  }
  if (hasDuplicate(assembly.originGraph.nodes, (node) => node.originId)) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_ORIGIN_ID);
  }
  if (hasDuplicate(assembly.originGraph.edges, (edge) => canonicalJson(edge))) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_ORIGIN_EDGE);
  }
  if (
    hasDuplicate(assembly.claimEvidenceLinks, (link) => canonicalJson(link))
  ) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_EVIDENCE_LINK);
  }

  if (
    assembly.admission.input.evidence.some(
      (record) => record.tier === EVIDENCE_TIER.DISCOVERY,
    ) ||
    assembly.documents.some(
      (document) => document.tier === EVIDENCE_TIER.DISCOVERY,
    )
  ) {
    return failure(
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.DISCOVERY_EVIDENCE_FORBIDDEN,
    );
  }
  if (
    assembly.documents.some(
      (document) =>
        document.rightsSnapshot.status !== RIGHTS_STATUS.APPROVED ||
        document.rightsSnapshot.allowedUse !== "publication_summary",
    )
  ) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.INVALID_RIGHTS_SNAPSHOT);
  }
  if (
    assembly.documents.some(
      (document) =>
        document.provenanceSnapshot.status !== PROVENANCE_STATUS.COMPLETE,
    )
  ) {
    return failure(
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.INVALID_PROVENANCE_SNAPSHOT,
    );
  }
  if (!compareAdmissionEvidence(assembly.admission.input, assembly.documents)) {
    return failure(
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.ADMISSION_EVIDENCE_MISMATCH,
    );
  }

  const claimIds = new Set(assembly.claims.map((claim) => claim.claimId));
  const documentIds = new Set(
    assembly.documents.map((document) => document.documentId),
  );
  if (assembly.claimEvidenceLinks.some((link) => !claimIds.has(link.claimId))) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.UNKNOWN_CLAIM_REFERENCE);
  }
  if (
    assembly.claimEvidenceLinks.some(
      (link) => !documentIds.has(link.documentId),
    )
  ) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.UNKNOWN_DOCUMENT_REFERENCE);
  }
  const linkedClaimIds = new Set(
    assembly.claimEvidenceLinks.map((link) => link.claimId),
  );
  if (assembly.claims.some((claim) => !linkedClaimIds.has(claim.claimId))) {
    return failure(
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.MISSING_CLAIM_EVIDENCE_LINK,
    );
  }

  const originGraph = validateOriginGraph(
    assembly.originGraph,
    assembly.documents,
  );
  if (originGraph === undefined) {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.INVALID_ORIGIN_GRAPH);
  }
  if (
    assembly.admission.input.topic === TOPIC.CURRENT_AFFAIRS &&
    !hasIndependentCurrentAffairsPair(
      assembly.documents,
      originGraph.terminalByDocumentId,
    )
  ) {
    return failure(
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.NON_INDEPENDENT_REQUIRED_CORROBORATION,
    );
  }

  try {
    const canonicalInput = sortAssemblyCollections(assembly);
    const claims = canonicalInput.claims.map((claim) => ({
      ...claim,
      claimFingerprint: fingerprint(claim),
    }));
    const packageWithoutId = {
      schemaVersion: canonicalInput.schemaVersion,
      storyId: canonicalInput.admission.input.storyId,
      topic: canonicalInput.admission.input.topic,
      policyVersion: canonicalInput.admission.input.policyVersion,
      decidedAt: canonicalInput.admission.decidedAt,
      assembledAt: canonicalInput.assembledAt,
      admissionInputFingerprint: fingerprint(canonicalInput.admission.input),
      admissionDecisionFingerprint: fingerprint(
        canonicalInput.admission.suppliedDecision,
      ),
      admissionDecision: canonicalInput.admission.suppliedDecision,
      documents: canonicalInput.documents,
      originGraph: canonicalInput.originGraph,
      claims,
      claimEvidenceLinks: canonicalInput.claimEvidenceLinks,
    };
    const evidencePackage = evidencePackageSchema.parse({
      ...packageWithoutId,
      packageId: fingerprint(packageWithoutId),
    });

    return { status: "ok", package: deepFreeze(evidencePackage) };
  } catch {
    return failure(EVIDENCE_PACKAGE_ASSEMBLY_REASON.CANONICALIZATION_FAILURE);
  }
}

export function serializeEvidencePackage(
  input: unknown,
): EvidencePackageSerializationResult {
  const parsed = evidencePackageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      reasonCode: EVIDENCE_PACKAGE_ASSEMBLY_REASON.CANONICALIZATION_FAILURE,
    };
  }

  const { packageId, ...packageWithoutId } = parsed.data;
  if (fingerprint(packageWithoutId) !== packageId) {
    return {
      status: "error",
      reasonCode: EVIDENCE_PACKAGE_ASSEMBLY_REASON.PACKAGE_IDENTITY_MISMATCH,
    };
  }

  return { status: "ok", bytes: canonicalJson(parsed.data) };
}

export type { EvidencePackageAssemblyInput };
