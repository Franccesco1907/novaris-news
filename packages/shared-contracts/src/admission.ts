import { z } from "zod";

export const EVIDENCE_TIER = {
  AUTHORITY: "E1",
  CORROBORATOR: "E2",
  DISCOVERY: "D",
} as const;

export const RIGHTS_STATUS = {
  APPROVED: "approved",
  MISSING: "missing",
  INVALID: "invalid",
} as const;

export const PROVENANCE_STATUS = {
  COMPLETE: "complete",
  MISSING: "missing",
  INVALID: "invalid",
} as const;

export const TOPIC = {
  GENERAL_ECONOMICS: "general_economics",
  TECHNOLOGY_SCIENCE: "technology_science",
  CLIMATE_ENVIRONMENT: "climate_environment",
  CURRENT_AFFAIRS: "current_affairs",
  PUBLIC_INTEREST: "public_interest",
} as const;

export const FINANCIAL_RECOMMENDATION = {
  NONE: "none",
  BUY: "buy",
  SELL: "sell",
  HOLD: "hold",
} as const;

export const EXCLUDED_CATEGORY = {
  NONE: "none",
  UNCONFIRMED_CRIME: "unconfirmed_crime",
  MEDICAL_ADVICE: "medical_advice",
  ELECTION_POLL: "election_poll",
  EMERGENCY_INSTRUCTION: "emergency_instruction",
  LIVE_CONFLICT_CASUALTY: "live_conflict_casualty",
} as const;

export const ADMISSION_OUTCOME = {
  ELIGIBLE: "eligible",
  HOLD: "hold",
  REJECT: "reject",
  STOP: "stop",
} as const;

export const ADMISSION_REASON = {
  ELIGIBLE_EVIDENCE: "eligible_evidence",
  CRITICAL_RIGHTS_FAILURE: "critical_rights_failure",
  CRITICAL_PROVENANCE_FAILURE: "critical_provenance_failure",
  CRITICAL_POLICY_DEPENDENCY_UNAVAILABLE:
    "critical_policy_dependency_unavailable",
  CRITICAL_PROVENANCE_DEPENDENCY_UNAVAILABLE:
    "critical_provenance_dependency_unavailable",
  DISCOVERY_CONTENT_CONTAMINATION: "discovery_content_contamination",
  FINANCIAL_RECOMMENDATION_PROHIBITED: "financial_recommendation_prohibited",
  EXCLUDED_HIGH_RISK_CATEGORY: "excluded_high_risk_category",
  STALE_EVIDENCE: "stale_evidence",
  OUTSIDE_SOURCE_REMIT: "outside_source_remit",
  MATERIAL_CONTRADICTION: "material_contradiction",
  MISSING_AUTHORITY_EVIDENCE: "missing_authority_evidence",
  INSUFFICIENT_INDEPENDENT_ORIGINS: "insufficient_independent_origins",
  MISSING_INDEPENDENT_CORROBORATOR: "missing_independent_corroborator",
} as const;

export const evidenceRecordSchema = z.object({
  documentId: z.string().min(1),
  tier: z.enum(EVIDENCE_TIER),
  originGroup: z.string().min(1),
  rightsStatus: z.enum(RIGHTS_STATUS),
  provenanceStatus: z.enum(PROVENANCE_STATUS),
  inRemit: z.boolean(),
  current: z.boolean(),
  materiallyContradicted: z.boolean().default(false),
});

export const evidenceAdmissionInputSchema = z.object({
  storyId: z.string().min(1),
  policyVersion: z.literal("phase1-v1"),
  topic: z.enum(TOPIC),
  policyServiceAvailable: z.boolean(),
  provenanceStoreAvailable: z.boolean(),
  containsDiscoveryContent: z.boolean(),
  financialRecommendation: z.enum(FINANCIAL_RECOMMENDATION),
  excludedCategory: z.enum(EXCLUDED_CATEGORY),
  evidence: z.array(evidenceRecordSchema),
});

export const evidenceAdmissionDecisionSchema = z.object({
  outcome: z.enum(ADMISSION_OUTCOME),
  reasonCodes: z.array(z.enum(ADMISSION_REASON)).min(1),
  independentOriginCount: z.number().int().nonnegative(),
});

export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;
export type EvidenceAdmissionInput = z.infer<
  typeof evidenceAdmissionInputSchema
>;
export type EvidenceAdmissionDecision = z.infer<
  typeof evidenceAdmissionDecisionSchema
>;
export type AdmissionOutcome =
  (typeof ADMISSION_OUTCOME)[keyof typeof ADMISSION_OUTCOME];
export type AdmissionReason =
  (typeof ADMISSION_REASON)[keyof typeof ADMISSION_REASON];
