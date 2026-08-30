# Novaris News architecture

## Architecture outcome

The system is a policy-gated modular monolith with Hexagonal Architecture. Evidence and provenance travel with a story from ingestion through playback; generation cannot bypass corroboration, and uncertainty in a critical control stops publication.

Phase 1 uses Node.js 24, TypeScript, pnpm workspaces, Zod contracts, Vitest, and an explicit PostgreSQL 17 integration boundary. PostgreSQL is exercised only through a disposable test service and an adapter behind a domain-owned port. Model, text-to-speech, cloud, and deployment vendors remain open decisions.

## Approved physical architecture

The implementation begins as one deployable system with explicit package boundaries. Microservices, Redis, Kafka, real source connectors, audio, scheduling, a public API, and deployment configuration are outside the current Phase 1 slices.

```text
novaris-news/
├── apps/
│   └── phase1-harness/       # Private deterministic fixture runner
├── packages/
│   ├── shared-contracts/     # Validated boundary inputs and outputs
│   ├── editorial-policy/     # Pure fail-closed evidence admission rules
│   ├── evidence-pipeline/    # Deterministic EvidencePackage assembly
│   ├── audit-lineage/        # Content-addressed audit domain and store port
│   ├── audit-postgres/       # PostgreSQL adapter, migration, and integration tests
│   ├── claim-validation/     # Whole-script structural evidence validation
│   └── script-generation/    # Audit-first generation use case and local adapter
├── compose.audit-test.yaml   # Disposable PostgreSQL 17 integration service
├── config/                   # Non-active source candidates
└── docs/                     # Product, policy, and architecture contracts
```

Only packages with working behavior exist. The planned `source-catalog` boundary will be added as an executable vertical slice—not as an empty placeholder.

```text
phase1-harness -> editorial-policy -> shared-contracts
phase1-harness -> evidence-pipeline -> shared-contracts
phase1-harness -> audit-lineage -> evidence-pipeline, shared-contracts
phase1-harness -> audit-postgres -> audit-lineage
audit-postgres -> audit-lineage -> evidence-pipeline, shared-contracts
claim-validation -> shared-contracts
script-generation -> audit-lineage, claim-validation, shared-contracts
phase1-harness -> script-generation
```

- Domain policy is pure and has no database, network, model, or framework dependency.
- Inputs and decisions are validated at boundaries with versioned Zod schemas.
- The private harness supplies synthetic data through the same public policy function a future adapter will call.
- Evidence-package assembly owns an admission-evaluator port. The harness adapts `editorial-policy`; `evidence-pipeline` does not import it.
- `audit-lineage` owns the application port, deterministic event construction, verification, and package reconstruction; it does not import PostgreSQL.
- `audit-postgres` implements that port with transactions, per-stream advisory locks, an append-only schema, and separate migration/runtime roles. Domain packages do not import a database client.
- `script-generation` accepts only audit identity and versioned generation controls, reconstructs the package internally, and exposes a bounded generator port.
- `claim-validation` rejects the entire candidate unless disclosure, sentence order, exact claim text, evidence ownership, context, and transcript all match.
- The current generator adapter is deterministic and local. Future AI and text-to-speech providers remain replaceable adapters and may receive only the same bounded request—not raw documents or unrestricted context.

| Area | First Phase 1 slice | Later Phase 1 or Phase 2 |
| --- | --- | --- |
| Inputs | Authored synthetic cases | Rights-cleared connectors after admission |
| Admission | Core fail-closed evidence rules | Full topic-policy and revision/tombstone coverage |
| Evidence package | Canonically serialized, content-addressed, recursively frozen synthetic package | Broader fixture coverage and semantic validation |
| Audit lineage | Canonical event hashing, chain verification, package reconstruction, and exact artifact bytes | External head anchoring, backup/restore, monitoring, and production hardening |
| Generation | Deterministic Spanish exact-claim script with whole-script validation | Provider adapter evaluation and stronger semantic validation |
| Persistence | Explicit disposable PostgreSQL 17 adapter test path; default harness remains DB-free | Hosted database, recovery objectives, operational hardening |
| Runtime | Private deterministic CLI | Internal orchestration, then private bulletin pipeline |
| Publication/audio | Not implemented | Phase 2 only |

The implemented slices prove policy admission, structural evidence-package assembly, deterministic audit reconstruction, adapter-level PostgreSQL evidence persistence, and exact-claim Spanish script validation using synthetic data. They do not persist script lineage, satisfy all 24 fixture cases, or pass the Phase 1 exit gate.

## Logical pipeline

```text
Active source catalog with evidence and discovery tiers
        |
Source ingestion -> Normalization -> Deduplication / clustering
        |                                  |
        +------------ Provenance ----------+
                                           v
                             Corroboration + risk gate
                                    | reject / hold
                                    v
                               Prioritization
                                    v
                           Evidence-bound script generation
                                    v
                         Claim validation + disclosure injection
                                    v
                              Text-to-speech
                                    v
                         Scheduling / web-audio delivery
                                    v
                           Provenance + corrections

Observability, audit, policy versioning, and kill-switch control span every stage.
```

## Component boundaries

| Boundary | Responsibility | Must not do |
| --- | --- | --- |
| Source catalog | Store evidence and discovery tiers, rights metadata, independence groups, topic scope, and collection rules | Treat admission as proof that every source claim is true |
| Source ingestion | Retrieve source material and immutable retrieval metadata | Publish or summarize directly |
| Normalization | Extract canonical text, dates, entities, language, and fingerprints | Discard original provenance |
| Deduplication and clustering | Group reports about the same event and identify shared upstream origins | Count syndication copies as independent corroboration |
| Corroboration and risk gate | Evaluate evidence sufficiency, independence, freshness, contradictions, and topic risk | Generate prose or weaken a policy because a story is popular |
| Evidence-package assembly | Re-evaluate admission, bind immutable snapshots and origin roots, validate structural claim links, and create a canonical content identity | Treat a structural link or fingerprint as proof that a claim is semantically true |
| Audit lineage | Preserve exact canonical package bytes, construct content-addressed per-story events, verify a chain against a trusted expected head, and reconstruct validated packages | Treat hashes as proof of factual truth or silently accept a missing/truncated stream |
| PostgreSQL audit adapter | Atomically append artifacts and events under a per-stream lock, enforce idempotency, and expose the domain store port | Leak `pg` into domain packages or grant the runtime role ownership/DDL/mutation privileges |
| Prioritization | Rank eligible stories for public relevance, urgency, recency, and diversity | Admit rejected stories or optimize solely for engagement |
| Script generation | Reconstruct a verified package from audit identity and send only bounded claim/link context to a replaceable generator | Accept a raw package, raw documents, discovery data, or unrestricted context |
| Claim validation | Require disclosure at sentence zero, exact admitted claim text, owned evidence links, stable context, and a derived transcript | Patch or partially accept an invalid script, or treat structural traceability as independent factual proof |
| Text-to-speech | Render an approved script and disclosure into audio | Change factual wording without creating a new script version |
| Scheduler and delivery | Assemble bulletins, enforce per-request edition eligibility, publish artifacts, and serve playback | Bypass publication, withdrawal, expiry, correction, or kill-switch state |
| Provenance and corrections | Expose sources, versions, update links, and correction history | Destructively replace a published record |
| Operations control | Observe health, enforce rate limits, and stop publication or playback | Edit editorial evidence silently |

## Key data objects

| Object | Minimum contents |
| --- | --- |
| `SourceDefinition` | source ID, owner, collection endpoint, source type, evidence tier, active status, rights/usage metadata, independence group, policy attributes |
| `SourceDocument` | immutable ID, source ID, URL, author if present, publication/retrieval times, language, original fingerprint, extracted content reference |
| `StoryCluster` | cluster ID, event time range, member documents, shared-origin relationships, entities, topics, lifecycle state |
| `EvidenceItem` | normalized claim or source passage, document reference, evidence type, independence group, freshness, contradiction status |
| `RiskDecision` | story ID, policy version, topic/risk classes, evidence evaluation, outcome (`eligible`, `hold`, `reject`), machine-readable reasons |
| `StoryBrief` | eligible evidence set, factual boundaries, priority signals, intended audience/language, expiry time |
| `ValidatedScriptVersion` | content identity, evidence-package and audit-event identity, generation-policy context, exact disclosure, ordered sentences, claim/evidence links, and derived transcript |
| `AudioAsset` | script version, voice configuration, audio fingerprint, duration, generation status |
| `Bulletin` | ordered item versions, schedule, original publication time, 16-hour expiry, transcript, audio asset, publication/withdrawal state, disclosure, region/language |
| `CorrectionRecord` | affected item/version, trigger evidence, corrected claims, replacement version, timestamps, audience notification state |
| `EvidencePackageArtifact` | exact canonical package bytes, semantic package snapshot, package ID, SHA-256 fingerprint, media type, and byte length |
| `AuditEvent` | schema version, decimal sequence, story stream, previous hash, request/idempotency fingerprints, event type and time, and exact package-lineage fingerprints |

Data object names remain conceptual unless implemented in a versioned contract. The current code implements evidence-admission boundaries, a versioned `EvidencePackage`, `EvidencePackageArtifact`, immutable audit-event contracts, and `ValidatedScriptVersion`.

The current whole-script validator proves deterministic structural traceability to admitted claim text and evidence references. It does not prove that the underlying source claim is factually true, that a source omitted no material context, or that exact claim text is editorially sufficient. Paraphrasing is deliberately disabled in this slice.

Audit verification requires a trusted expected head supplied from outside the stream being checked. This detects tail truncation, but no hash chain can prove that a whole stream existed after both the stream and its only in-database head reference are deleted. Production design therefore still needs an independently protected head anchor plus tested backup and restore procedures.

The migration stores exact canonical bytes beside semantic JSON and uses constraints, triggers, grants, and separate migrator/runtime roles to reject ordinary mutation. This is defense in depth, not external notarization: a database owner or superuser can still alter or disable database controls.

## State and trust boundaries

1. **Untrusted input:** all retrieved content is untrusted, including text that attempts to instruct the AI system.
2. **Evidence admission:** only normalized evidence from an admitted evidence-tier source and successful policy evaluation may enter a `StoryBrief`; discovery-tier content never enters the brief.
3. **Generative boundary:** the public use case receives audit identity rather than a raw package; only after verified reconstruction does the generator receive bounded claim and evidence-reference context.
4. **Publication boundary:** `ValidatedScriptVersion` is not publishable. Audio and publication controls remain unimplemented.
5. **Operational boundary:** kill-switch and policy changes require authenticated, auditable operator authority.

## Failure behavior

| Failure | Behavior |
| --- | --- |
| Source unavailable | Retry within bounds; continue other sources; expire or hold clusters that lose required evidence |
| Parser or normalization uncertainty | Quarantine the document; do not treat extracted content as evidence |
| Duplicate or common-origin ambiguity | Treat reports as one independence group until proven otherwise |
| Contradictory material claims | Hold the item or report only the verified fact of disagreement when policy explicitly permits it |
| Corroboration/risk service unavailable | Stop affected stories before prioritization |
| Generator timeout | Retry idempotently within bounds; never publish a partial script |
| Unsupported claim detected | Reject the script version; do not patch it downstream |
| TTS failure | Retain the approved script and retry audio generation; do not publish a broken asset |
| Scheduler failure | Preserve idempotent publication state and prevent duplicate bulletins |
| Provenance or audit store unavailable | Stop new publication because traceability cannot be guaranteed |
| Abnormal correction or rejection spike | Pause the affected topic/source segment and alert operations |
| Kill switch activated | Stop new publication immediately; apply the configured policy to queued and currently playing content; record the action |
| New scheduled edition held | Re-evaluate the latest valid edition on every request; replay it only inside its own 16-hour window with audible and visible disclosure |
| Edition expired or no edition eligible | Show an unavailable status and serve no audio; never synthesize filler |
| Critical published error | Withdraw immediately, invalidate cached playback, preserve immutable internal history, and start the correction/incident runbook |

## Corrections flow

1. New or changed evidence is linked to the existing story cluster.
2. The corroboration gate reassesses affected material claims under the current policy.
3. A material change creates a new script and audio version plus a `CorrectionRecord`.
4. Delivery surfaces preserve the earlier version, label it, and link to the correction.
5. A later bulletin includes the correction when audience impact rules require it.

## Observability and control

Required signals include source freshness, cluster volume, independence count, rejection reasons, unsupported-claim detections, generation latency, publication latency, correction rate, playback health, and kill-switch state. Alerts must distinguish a local source failure from a safety-control failure.

Playback authorization is a request-time decision. Asset URLs and caches must not outlive the current kill-switch, withdrawal, or 16-hour expiry state. See the [bulletin lifecycle policy](BULLETIN_LIFECYCLE.md).

The kill switch must support at least a global publication stop. Segment-level controls for a source, topic, language, or region may be added, but they must fail closed and leave an audit record.

## Architecture decisions still open

- PostgreSQL hosting, independently protected head anchoring, backup/restore, monitoring, and production hardening. The current schema and migration are integration-test artifacts, not a production approval.
- Internal orchestration and transaction boundaries after the pure policy slice.
- Model and text-to-speech providers, including fallback policy.
- Deployment topology and regional data boundaries.
- Exact source-ingestion protocols and promotion of reviewed registry candidates to active evidence status.
- Streaming protocol, content delivery, and player implementation.
- Counsel-approved retention periods and tamper-evidence mechanism.
- Recovery objectives and scale targets.
