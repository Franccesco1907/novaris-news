# Novaris News architecture

## Architecture outcome

The system is a policy-gated modular monolith with Hexagonal Architecture. Evidence and provenance travel with a story from ingestion through playback; generation cannot bypass corroboration, and uncertainty in a critical control stops publication.

Phase 1 uses Node.js 24, TypeScript, pnpm workspaces, Zod contracts, and Vitest. PostgreSQL is the future authoritative store behind ports; no database or external service is connected in the current slices. Model, text-to-speech, cloud, and deployment vendors remain open decisions.

## Approved physical architecture

The implementation begins as one deployable system with explicit package boundaries. Microservices, Redis, Kafka, real source connectors, audio, scheduling, a public API, and deployment configuration are outside the current Phase 1 slices.

```text
novaris-news/
├── apps/
│   └── phase1-harness/       # Private deterministic fixture runner
├── packages/
│   ├── shared-contracts/     # Validated boundary inputs and outputs
│   ├── editorial-policy/     # Pure fail-closed evidence admission rules
│   └── evidence-pipeline/    # Deterministic EvidencePackage assembly
├── config/                   # Non-active source candidates
└── docs/                     # Product, policy, and architecture contracts
```

Only packages with working behavior exist. The planned `source-catalog`, `script-generation`, `claim-validation`, and `audit` boundaries will be added as executable vertical slices—not as empty placeholders.

```text
phase1-harness -> editorial-policy -> shared-contracts
phase1-harness -> evidence-pipeline -> shared-contracts
```

- Domain policy is pure and has no database, network, model, or framework dependency.
- Inputs and decisions are validated at boundaries with versioned Zod schemas.
- The private harness supplies synthetic data through the same public policy function a future adapter will call.
- Evidence-package assembly owns an admission-evaluator port. The harness adapts `editorial-policy`; `evidence-pipeline` does not import it.
- Future PostgreSQL persistence will implement domain-owned ports. Domain packages must not import a database client.
- Future AI and text-to-speech providers will be replaceable adapters. A generator may receive only an admitted `EvidencePackage`.

| Area | First Phase 1 slice | Later Phase 1 or Phase 2 |
| --- | --- | --- |
| Inputs | Authored synthetic cases | Rights-cleared connectors after admission |
| Admission | Core fail-closed evidence rules | Full topic-policy and revision/tombstone coverage |
| Evidence package | Canonically serialized, content-addressed, recursively frozen synthetic package | Persistence and broader fixture coverage |
| Generation | Not implemented | Bounded generation and semantic claim validation |
| Persistence | In-memory values only | PostgreSQL through ports, immutable audit records |
| Runtime | Private deterministic CLI | Internal orchestration, then private bulletin pipeline |
| Publication/audio | Not implemented | Phase 2 only |

The implemented slices prove policy admission and structural evidence-package assembly. They do not satisfy all 24 fixture cases or the Phase 1 exit gate.

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
| Prioritization | Rank eligible stories for public relevance, urgency, recency, and diversity | Admit rejected stories or optimize solely for engagement |
| Script generation | Produce a concise bulletin script constrained to approved evidence | Add unsupported context, quotes, or certainty |
| Claim validation | Map material claims to evidence and verify required disclosure | Repair missing evidence by inventing text |
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
| `ScriptVersion` | immutable script, sentence-to-evidence links, model/prompt versions, disclosure text, validation result |
| `AudioAsset` | script version, voice configuration, audio fingerprint, duration, generation status |
| `Bulletin` | ordered item versions, schedule, original publication time, 16-hour expiry, transcript, audio asset, publication/withdrawal state, disclosure, region/language |
| `CorrectionRecord` | affected item/version, trigger evidence, corrected claims, replacement version, timestamps, audience notification state |
| `AuditEvent` | actor/service, action, object and version, policy result, timestamp, correlation ID |

Data object names remain conceptual unless implemented in a versioned contract. The current code implements evidence-admission boundaries and a versioned `EvidencePackage` contract with immutable document, rights, provenance, origin-graph, atomic-claim, and evidence-link snapshots.

## State and trust boundaries

1. **Untrusted input:** all retrieved content is untrusted, including text that attempts to instruct the AI system.
2. **Evidence admission:** only normalized evidence from an admitted evidence-tier source and successful policy evaluation may enter a `StoryBrief`; discovery-tier content never enters the brief.
3. **Generative boundary:** the generator receives the bounded brief, not unrestricted source feeds or operator secrets.
4. **Publication boundary:** only an immutable script version with a successful claim-validation result can produce a publishable audio asset.
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

- PostgreSQL schema, hosting, migration strategy, and tamper-evidence design.
- Internal orchestration and transaction boundaries after the pure policy slice.
- Model and text-to-speech providers, including fallback policy.
- Deployment topology and regional data boundaries.
- Exact source-ingestion protocols and promotion of reviewed registry candidates to active evidence status.
- Streaming protocol, content delivery, and player implementation.
- Counsel-approved retention periods and tamper-evidence mechanism.
- Recovery objectives and scale targets.
