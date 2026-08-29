import { describe, expect, it } from "vitest";

import { assembleEvidencePackage } from "@novaris/evidence-pipeline";
import {
  AUDIT_GENESIS_HASH,
  type AuditAppendResult,
  type AuditEvent,
  type EvidencePackage,
  type EvidencePackageArtifact,
  type PreparedAuditAppend,
  type StoredArtifactResult,
  type StoredAuditStreamResult,
} from "@novaris/shared-contracts";

import {
  materializeAuditEvent,
  prepareEvidencePackageAuditAppend,
  reconstructEvidencePackage,
  verifyAuditStream,
  type EvidencePackageAuditStore,
} from "./index.js";

const HASH_A = `sha256:${"a".repeat(64)}`;
const HASH_B = `sha256:${"b".repeat(64)}`;
const HASH_C = `sha256:${"c".repeat(64)}`;
const HASH_D = `sha256:${"d".repeat(64)}`;
const OCCURRED_AT = "2026-08-29T12:00:00.000Z";

function makePackage(): EvidencePackage {
  const decision = {
    outcome: "eligible" as const,
    reasonCodes: ["eligible_evidence" as const],
    independentOriginCount: 1,
  };
  const result = assembleEvidencePackage(
    {
      schemaVersion: "evidence-package-v1",
      admission: {
        input: {
          storyId: "story-audit",
          policyVersion: "phase1-v1",
          topic: "technology_science",
          policyServiceAvailable: true,
          provenanceStoreAvailable: true,
          containsDiscoveryContent: false,
          financialRecommendation: "none",
          excludedCategory: "none",
          evidence: [
            {
              documentId: "doc-audit",
              tier: "E1",
              originGroup: "origin-audit",
              rightsStatus: "approved",
              provenanceStatus: "complete",
              inRemit: true,
              current: true,
              materiallyContradicted: false,
            },
          ],
        },
        suppliedDecision: decision,
        decidedAt: OCCURRED_AT,
      },
      assembledAt: OCCURRED_AT,
      documents: [
        {
          documentId: "doc-audit",
          sourceId: "source-audit",
          tier: "E1",
          originGroup: "origin-audit",
          originNodeId: "origin-audit",
          sourceFingerprint: HASH_A,
          documentFingerprint: HASH_B,
          rightsSnapshot: {
            snapshotId: "rights-audit",
            snapshotHash: HASH_C,
            status: "approved",
            capturedAt: OCCURRED_AT,
            allowedUse: "publication_summary",
          },
          provenanceSnapshot: {
            snapshotId: "provenance-audit",
            snapshotHash: HASH_D,
            status: "complete",
            capturedAt: OCCURRED_AT,
          },
          inRemit: true,
          current: true,
          materiallyContradicted: false,
        },
      ],
      originGraph: {
        nodes: [{ originId: "origin-audit", fingerprint: HASH_A }],
        edges: [],
      },
      claims: [
        { claimId: "claim-audit", text: "The authority published an update." },
      ],
      claimEvidenceLinks: [
        {
          claimId: "claim-audit",
          documentId: "doc-audit",
          evidenceFragmentFingerprint: HASH_B,
          locator: "paragraph:1",
        },
      ],
    },
    { evaluate: () => decision },
  );
  if (result.status !== "ok") throw new Error(result.reasonCode);
  return result.package;
}

function prepare(idempotencyKey = "request-1", expected = AUDIT_GENESIS_HASH) {
  return prepareEvidencePackageAuditAppend({
    package: makePackage(),
    idempotencyKey,
    occurredAt: OCCURRED_AT,
    expectedPreviousEventHash: expected,
  });
}

class MemoryStore implements EvidencePackageAuditStore {
  events: AuditEvent[] = [];
  artifacts = new Map<string, EvidencePackageArtifact>();

  async append(command: PreparedAuditAppend): Promise<AuditAppendResult> {
    const prior = this.events.find(
      (event) =>
        event.streamId === command.streamId &&
        event.idempotencyKey === command.idempotencyKey,
    );
    if (prior !== undefined) {
      if (prior.requestFingerprint !== command.requestFingerprint) {
        return { status: "error", reasonCode: "idempotency_conflict" };
      }
      return {
        status: "ok",
        event: prior,
        artifact: command.artifact,
        replayed: true,
      };
    }
    const head = this.events.at(-1);
    const previous = head?.eventHash ?? AUDIT_GENESIS_HASH;
    if (previous !== command.expectedPreviousEventHash) {
      return { status: "error", reasonCode: "stream_concurrency_conflict" };
    }
    const event = materializeAuditEvent(
      command,
      String(this.events.length + 1),
      previous,
    );
    this.artifacts.set(command.artifact.artifactId, command.artifact);
    this.events.push(event);
    return { status: "ok", event, artifact: command.artifact, replayed: false };
  }

  async readStream(): Promise<StoredAuditStreamResult> {
    return { status: "ok", events: structuredClone(this.events) };
  }

  async readArtifact(artifactId: string): Promise<StoredArtifactResult> {
    const artifact = this.artifacts.get(artifactId);
    return artifact === undefined
      ? { status: "not_found" }
      : { status: "ok", artifact: structuredClone(artifact) };
  }
}

function requirePrepared(
  result: ReturnType<typeof prepare>,
): PreparedAuditAppend {
  if (result.status !== "ok") throw new Error(result.reasonCode);
  return result.command;
}

describe("audit lineage", () => {
  it("AL01 creates deterministic artifacts and events", () => {
    const first = requirePrepared(prepare());
    const second = requirePrepared(prepare());
    expect(first).toEqual(second);
    expect(first.artifact.artifactId).toBe(first.artifact.bytesFingerprint);
    expect(first.artifact.byteLength).toBe(
      Buffer.byteLength(first.artifact.canonicalBytes),
    );
    expect(materializeAuditEvent(first, "1", AUDIT_GENESIS_HASH)).toEqual(
      materializeAuditEvent(second, "1", AUDIT_GENESIS_HASH),
    );
  });

  it("AL02 replays an identical idempotent request", async () => {
    const store = new MemoryStore();
    const command = requirePrepared(prepare());
    expect((await store.append(command)).status).toBe("ok");
    const replay = await store.append(command);
    expect(replay).toMatchObject({ status: "ok", replayed: true });
    expect(store.events).toHaveLength(1);
  });

  it("AL03 rejects changed intent under one idempotency key", async () => {
    const store = new MemoryStore();
    const command = requirePrepared(prepare());
    await store.append(command);
    const changed = { ...command, requestFingerprint: HASH_A };
    expect(await store.append(changed)).toEqual({
      status: "error",
      reasonCode: "idempotency_conflict",
    });
  });

  it("AL04 detects modified event material", async () => {
    const store = new MemoryStore();
    const receipt = await store.append(requirePrepared(prepare()));
    if (receipt.status !== "ok") throw new Error(receipt.reasonCode);
    store.events[0] = {
      ...receipt.event,
      occurredAt: "2026-08-29T13:00:00.000Z",
    };
    expect(
      await verifyAuditStream(
        receipt.event.streamId,
        receipt.event.eventHash,
        store,
      ),
    ).toEqual({
      status: "error",
      reasonCode: "chain_hash_mismatch",
    });
  });

  it("AL05 detects a sequence gap", async () => {
    const store = new MemoryStore();
    const command = requirePrepared(prepare());
    const event = materializeAuditEvent(command, "2", AUDIT_GENESIS_HASH);
    store.events = [event];
    store.artifacts.set(command.artifact.artifactId, command.artifact);
    expect(
      await verifyAuditStream(event.streamId, event.eventHash, store),
    ).toMatchObject({
      status: "error",
      reasonCode: "sequence_gap",
    });
  });

  it("AL06 detects divergent successors", async () => {
    const store = new MemoryStore();
    const command = requirePrepared(prepare());
    const first = materializeAuditEvent(command, "1", AUDIT_GENESIS_HASH);
    const second = materializeAuditEvent(
      { ...command, idempotencyKey: "request-2", requestFingerprint: HASH_B },
      "2",
      first.eventHash,
    );
    const fork = materializeAuditEvent(
      { ...command, idempotencyKey: "request-3", requestFingerprint: HASH_C },
      "3",
      first.eventHash,
    );
    store.events = [first, second, fork];
    store.artifacts.set(command.artifact.artifactId, command.artifact);
    expect(
      await verifyAuditStream(first.streamId, fork.eventHash, store),
    ).toMatchObject({
      status: "error",
      reasonCode: "chain_fork",
    });
  });

  it("AL07 detects missing and modified artifacts", async () => {
    const store = new MemoryStore();
    const receipt = await store.append(requirePrepared(prepare()));
    if (receipt.status !== "ok") throw new Error(receipt.reasonCode);
    store.artifacts.clear();
    expect(
      await verifyAuditStream(
        receipt.event.streamId,
        receipt.event.eventHash,
        store,
      ),
    ).toMatchObject({
      status: "error",
      reasonCode: "missing_artifact",
    });
    store.artifacts.set(receipt.artifact.artifactId, {
      ...receipt.artifact,
      canonicalBytes: `${receipt.artifact.canonicalBytes} `,
    });
    expect(
      await verifyAuditStream(
        receipt.event.streamId,
        receipt.event.eventHash,
        store,
      ),
    ).toMatchObject({
      status: "error",
      reasonCode: "artifact_bytes_mismatch",
    });
  });

  it("AL08 detects event/package lineage mismatch", async () => {
    const store = new MemoryStore();
    const command = requirePrepared(prepare());
    const event = materializeAuditEvent(command, "1", AUDIT_GENESIS_HASH);
    store.events = [{ ...event, storyId: "different-story" }];
    store.events[0]!.eventHash = materializeAuditEvent(
      {
        ...command,
        packageLineage: {
          ...command.packageLineage,
          storyId: "different-story",
        },
      },
      "1",
      AUDIT_GENESIS_HASH,
    ).eventHash;
    store.artifacts.set(command.artifact.artifactId, command.artifact);
    expect(
      await verifyAuditStream(
        event.streamId,
        store.events[0]!.eventHash,
        store,
      ),
    ).toMatchObject({
      status: "error",
      reasonCode: "event_artifact_lineage_mismatch",
    });
  });

  it("AL09 detects tail truncation and reconstructs a verified package", async () => {
    const store = new MemoryStore();
    const receipt = await store.append(requirePrepared(prepare()));
    if (receipt.status !== "ok") throw new Error(receipt.reasonCode);
    expect(
      await verifyAuditStream(receipt.event.streamId, HASH_A, store),
    ).toMatchObject({
      status: "error",
      reasonCode: "tail_truncation",
    });
    const reconstructed = await reconstructEvidencePackage(
      receipt.event.streamId,
      "1",
      receipt.event.eventHash,
      store,
    );
    expect(reconstructed).toMatchObject({
      status: "ok",
      package: { packageId: receipt.artifact.packageId },
    });
  });

  it("AL10 contains malformed and unavailable store boundaries", async () => {
    const command = requirePrepared(prepare());
    const event = materializeAuditEvent(command, "1", AUDIT_GENESIS_HASH);
    const expectedHead = event.eventHash;
    const append = async (): Promise<AuditAppendResult> => ({
      status: "error",
      reasonCode: "persistence_failure",
    });

    for (const readStream of [
      async () => null,
      async () => ({ status: "ok", events: null }),
    ]) {
      const result = await verifyAuditStream(
        "story:story-audit",
        expectedHead,
        {
          append,
          readStream,
          readArtifact: async () => ({ status: "not_found" }),
        } as unknown as EvidencePackageAuditStore,
      );
      expect(result).toEqual({
        status: "error",
        reasonCode: "invalid_store_result",
      });
    }

    await expect(
      verifyAuditStream("story:story-audit", expectedHead, {
        append,
        readStream: async () => {
          throw new Error("store unavailable");
        },
        readArtifact: async () => ({ status: "not_found" }),
      }),
    ).resolves.toEqual({
      status: "error",
      reasonCode: "persistence_unavailable",
    });

    for (const reasonCode of [
      "persistence_unavailable" as const,
      "persistence_failure" as const,
    ]) {
      await expect(
        verifyAuditStream("story:story-audit", expectedHead, {
          append,
          readStream: async () => ({ status: "error", reasonCode }),
          readArtifact: async () => ({ status: "not_found" }),
        }),
      ).resolves.toEqual({ status: "error", reasonCode });
    }

    for (const readArtifact of [
      async () => null,
      async () => ({ status: "ok", artifact: null }),
    ]) {
      const result = await verifyAuditStream(
        "story:story-audit",
        expectedHead,
        {
          append,
          readStream: async () => ({ status: "ok", events: [event] }),
          readArtifact,
        } as unknown as EvidencePackageAuditStore,
      );
      expect(result).toEqual({
        status: "error",
        reasonCode: "invalid_store_result",
      });
    }

    await expect(
      verifyAuditStream("story:story-audit", expectedHead, {
        append,
        readStream: async () => ({ status: "ok", events: [event] }),
        readArtifact: async () => Promise.reject(new Error("read failed")),
      }),
    ).resolves.toEqual({
      status: "error",
      reasonCode: "persistence_unavailable",
    });

    await expect(
      verifyAuditStream("story:story-audit", expectedHead, {
        append,
        readStream: async () => ({ status: "ok", events: [event] }),
        readArtifact: async () => ({
          status: "error",
          reasonCode: "persistence_failure",
        }),
      }),
    ).resolves.toEqual({
      status: "error",
      reasonCode: "persistence_failure",
    });
  });
});
