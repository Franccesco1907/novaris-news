import {
  prepareEvidencePackageAuditAppend,
  reconstructEvidencePackage,
} from "@novaris/audit-lineage";
import { PostgresAuditStore } from "@novaris/audit-postgres";
import { evaluateEvidenceAdmission } from "@novaris/editorial-policy";
import { assembleEvidencePackage } from "@novaris/evidence-pipeline";
import { AUDIT_GENESIS_HASH } from "@novaris/shared-contracts";

import { evidencePackageCases } from "./package-cases.js";

const connectionString = process.env.AUDIT_RUNTIME_URL;
if (connectionString === undefined || connectionString.length === 0) {
  throw new Error("AUDIT_RUNTIME_URL is required");
}

const assembly = assembleEvidencePackage(evidencePackageCases[0]!.input, {
  evaluate: evaluateEvidenceAdmission,
});
if (assembly.status !== "ok") throw new Error(assembly.reasonCode);

const prepared = prepareEvidencePackageAuditAppend({
  package: assembly.package,
  idempotencyKey: "synthetic-audit-harness-v1",
  occurredAt: "2026-08-29T12:00:00.000Z",
  expectedPreviousEventHash: AUDIT_GENESIS_HASH,
});
if (prepared.status !== "ok") throw new Error(prepared.reasonCode);

const writer = new PostgresAuditStore({ connectionString });
const receipt = await writer.append(prepared.command);
await writer.close();
if (receipt.status !== "ok") throw new Error(receipt.reasonCode);

const reader = new PostgresAuditStore({ connectionString });
const reconstruction = await reconstructEvidencePackage(
  receipt.event.streamId,
  receipt.event.sequence,
  receipt.event.eventHash,
  reader,
);
await reader.close();
if (reconstruction.status !== "ok") throw new Error(reconstruction.reasonCode);

console.log(
  `Audit harness: persisted and reconstructed ${reconstruction.package.packageId} (${receipt.replayed ? "replayed" : "appended"}).`,
);
