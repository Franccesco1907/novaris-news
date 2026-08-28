import {
  ADMISSION_OUTCOME,
  ADMISSION_REASON,
  EVIDENCE_TIER,
  EXCLUDED_CATEGORY,
  FINANCIAL_RECOMMENDATION,
  PROVENANCE_STATUS,
  RIGHTS_STATUS,
  TOPIC,
  evidenceAdmissionDecisionSchema,
  evidenceAdmissionInputSchema,
  type AdmissionOutcome,
  type AdmissionReason,
  type EvidenceAdmissionInput,
  type EvidenceAdmissionDecision,
} from "@novaris/shared-contracts";

function decision(
  outcome: AdmissionOutcome,
  reasonCode: AdmissionReason,
  independentOriginCount: number,
): EvidenceAdmissionDecision {
  return evidenceAdmissionDecisionSchema.parse({
    outcome,
    reasonCodes: [reasonCode],
    independentOriginCount,
  });
}

function hasIndependentCorroborator(
  evidence: EvidenceAdmissionInput["evidence"],
): boolean {
  const authorityOrigins = evidence
    .filter((record) => record.tier === EVIDENCE_TIER.AUTHORITY)
    .map((record) => record.originGroup);
  const corroboratorOrigins = evidence
    .filter((record) => record.tier === EVIDENCE_TIER.CORROBORATOR)
    .map((record) => record.originGroup);

  return corroboratorOrigins.some((corroboratorOrigin) =>
    authorityOrigins.some(
      (authorityOrigin) => authorityOrigin !== corroboratorOrigin,
    ),
  );
}

export function evaluateEvidenceAdmission(
  input: unknown,
): EvidenceAdmissionDecision {
  const admission = evidenceAdmissionInputSchema.parse(input);
  const independentOriginCount = new Set(
    admission.evidence.map((record) => record.originGroup),
  ).size;

  if (!admission.policyServiceAvailable) {
    return decision(
      ADMISSION_OUTCOME.STOP,
      ADMISSION_REASON.CRITICAL_POLICY_DEPENDENCY_UNAVAILABLE,
      independentOriginCount,
    );
  }

  if (!admission.provenanceStoreAvailable) {
    return decision(
      ADMISSION_OUTCOME.STOP,
      ADMISSION_REASON.CRITICAL_PROVENANCE_DEPENDENCY_UNAVAILABLE,
      independentOriginCount,
    );
  }

  if (
    admission.evidence.some(
      (record) => record.rightsStatus !== RIGHTS_STATUS.APPROVED,
    )
  ) {
    return decision(
      ADMISSION_OUTCOME.STOP,
      ADMISSION_REASON.CRITICAL_RIGHTS_FAILURE,
      independentOriginCount,
    );
  }

  if (
    admission.evidence.some(
      (record) => record.provenanceStatus !== PROVENANCE_STATUS.COMPLETE,
    )
  ) {
    return decision(
      ADMISSION_OUTCOME.STOP,
      ADMISSION_REASON.CRITICAL_PROVENANCE_FAILURE,
      independentOriginCount,
    );
  }

  if (admission.excludedCategory !== EXCLUDED_CATEGORY.NONE) {
    return decision(
      ADMISSION_OUTCOME.REJECT,
      ADMISSION_REASON.EXCLUDED_HIGH_RISK_CATEGORY,
      independentOriginCount,
    );
  }

  if (
    admission.containsDiscoveryContent ||
    admission.evidence.some((record) => record.tier === EVIDENCE_TIER.DISCOVERY)
  ) {
    return decision(
      ADMISSION_OUTCOME.REJECT,
      ADMISSION_REASON.DISCOVERY_CONTENT_CONTAMINATION,
      independentOriginCount,
    );
  }

  if (admission.financialRecommendation !== FINANCIAL_RECOMMENDATION.NONE) {
    return decision(
      ADMISSION_OUTCOME.REJECT,
      ADMISSION_REASON.FINANCIAL_RECOMMENDATION_PROHIBITED,
      independentOriginCount,
    );
  }

  if (admission.evidence.some((record) => !record.current)) {
    return decision(
      ADMISSION_OUTCOME.REJECT,
      ADMISSION_REASON.STALE_EVIDENCE,
      independentOriginCount,
    );
  }

  if (admission.evidence.some((record) => !record.inRemit)) {
    return decision(
      ADMISSION_OUTCOME.REJECT,
      ADMISSION_REASON.OUTSIDE_SOURCE_REMIT,
      independentOriginCount,
    );
  }

  if (admission.evidence.some((record) => record.materiallyContradicted)) {
    return decision(
      ADMISSION_OUTCOME.HOLD,
      ADMISSION_REASON.MATERIAL_CONTRADICTION,
      independentOriginCount,
    );
  }

  if (
    !admission.evidence.some(
      (record) => record.tier === EVIDENCE_TIER.AUTHORITY,
    )
  ) {
    return decision(
      ADMISSION_OUTCOME.HOLD,
      ADMISSION_REASON.MISSING_AUTHORITY_EVIDENCE,
      independentOriginCount,
    );
  }

  if (admission.topic === TOPIC.CURRENT_AFFAIRS && independentOriginCount < 2) {
    return decision(
      ADMISSION_OUTCOME.HOLD,
      ADMISSION_REASON.INSUFFICIENT_INDEPENDENT_ORIGINS,
      independentOriginCount,
    );
  }

  if (
    admission.topic === TOPIC.CURRENT_AFFAIRS &&
    !hasIndependentCorroborator(admission.evidence)
  ) {
    return decision(
      ADMISSION_OUTCOME.HOLD,
      ADMISSION_REASON.MISSING_INDEPENDENT_CORROBORATOR,
      independentOriginCount,
    );
  }

  return decision(
    ADMISSION_OUTCOME.ELIGIBLE,
    ADMISSION_REASON.ELIGIBLE_EVIDENCE,
    independentOriginCount,
  );
}
