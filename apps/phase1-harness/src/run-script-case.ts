import {
  materializeAuditEvent,
  prepareEvidencePackageAuditAppend,
  type EvidencePackageAuditStore,
} from "@novaris/audit-lineage";
import { evaluateEvidenceAdmission } from "@novaris/editorial-policy";
import { assembleEvidencePackage } from "@novaris/evidence-pipeline";
import {
  DeterministicScriptGenerator,
  generateVerifiedScript,
} from "@novaris/script-generation";
import {
  AUDIT_GENESIS_HASH,
  SCRIPT_GENERATION_POLICY_VERSION,
  SCRIPT_LANGUAGE,
  type AuditAppendResult,
  type AuditEvent,
  type EvidencePackageArtifact,
  type PreparedAuditAppend,
  type StoredArtifactResult,
  type StoredAuditStreamResult,
} from "@novaris/shared-contracts";

import { evidencePackageCases } from "./package-cases.js";
import type { HarnessResult } from "./run-cases.js";

const GENERATED_AT = "2026-08-29T15:00:00.000Z";

class SyntheticAuditStore implements EvidencePackageAuditStore {
  event: AuditEvent | undefined;
  artifact: EvidencePackageArtifact | undefined;

  async append(command: PreparedAuditAppend): Promise<AuditAppendResult> {
    this.event = materializeAuditEvent(command, "1", AUDIT_GENESIS_HASH);
    this.artifact = command.artifact;
    return {
      status: "ok",
      event: this.event,
      artifact: this.artifact,
      replayed: false,
    };
  }

  async readStream(): Promise<StoredAuditStreamResult> {
    return this.event === undefined
      ? { status: "ok", events: [] }
      : { status: "ok", events: [structuredClone(this.event)] };
  }

  async readArtifact(artifactId: string): Promise<StoredArtifactResult> {
    return this.artifact?.artifactId === artifactId
      ? { status: "ok", artifact: structuredClone(this.artifact) }
      : { status: "not_found" };
  }
}

export async function runVerifiedScriptCase(
  expected = "ok",
): Promise<HarnessResult> {
  const assembly = assembleEvidencePackage(evidencePackageCases[0]!.input, {
    evaluate: evaluateEvidenceAdmission,
  });
  if (assembly.status !== "ok") {
    return {
      passed: 0,
      failures: [
        { id: "script-verified", expected, received: assembly.reasonCode },
      ],
    };
  }
  const prepared = prepareEvidencePackageAuditAppend({
    package: assembly.package,
    idempotencyKey: "synthetic-script-harness-v1",
    occurredAt: GENERATED_AT,
    expectedPreviousEventHash: AUDIT_GENESIS_HASH,
  });
  if (prepared.status !== "ok") {
    return {
      passed: 0,
      failures: [
        { id: "script-verified", expected, received: prepared.reasonCode },
      ],
    };
  }
  const store = new SyntheticAuditStore();
  const receipt = await store.append(prepared.command);
  if (receipt.status !== "ok") {
    return {
      passed: 0,
      failures: [
        { id: "script-verified", expected, received: receipt.reasonCode },
      ],
    };
  }
  const result = await generateVerifiedScript(
    {
      streamId: receipt.event.streamId,
      sequence: receipt.event.sequence,
      expectedHeadHash: receipt.event.eventHash,
      generatedAt: GENERATED_AT,
      language: SCRIPT_LANGUAGE.SPANISH,
      generationPolicyVersion: SCRIPT_GENERATION_POLICY_VERSION.V1,
    },
    { auditStore: store, generator: new DeterministicScriptGenerator() },
  );
  const received =
    result.status === "ok"
      ? "ok"
      : `${result.reasonCode}${"detailCode" in result ? `:${result.detailCode}` : ""}`;
  return received === expected
    ? { passed: 1, failures: [] }
    : {
        passed: 0,
        failures: [{ id: "script-verified", expected, received }],
      };
}
