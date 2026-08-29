# Phase 1 evidence-pipeline fixtures

## Fixture policy

Phase 1 starts with synthetic or explicitly rights-cleared inputs. Real connector entries in the source registry are non-active until endpoint, terms-snapshot, rights, attribution, revision, and technical reviews pass.

Every fixture includes source documents, rights record, upstream-origin graph, product/revision fields, expected claims, expected policy version, and an immutable expected decision. Discovery text is stored outside the evidence package.

## Expected outcome vocabulary

Fixtures assert either a prepublication evidence decision or a playback/correction lifecycle outcome. They must not collapse those two state machines into one ambiguous field.

| Outcome | Meaning |
| --- | --- |
| `eligible` | Evidence package may proceed to bounded generation |
| `hold` | Evidence might become sufficient within its product/event window |
| `reject` | Evidence or output cannot satisfy policy for this edition |
| `stop` | Critical rights, provenance, policy, privacy, or operational control failed |
| `replay` | A prior unaffected edition remains inside its own window and must carry replay disclosure |
| `withdrawn` | A published edition is immediately ineligible for public playback while its internal history remains preserved |
| `expired` | The edition is at or beyond its own 16-hour boundary; the player shows an unavailable status and serves no audio |

## Core fixtures

| ID | Synthetic/rights-cleared case | Expected outcome | Assertion |
| --- | --- | --- | --- |
| F01 | Synthetic BCRP-like indicator with exact period, unit, vintage, methodology, and approved rights snapshot | `eligible` | Exact-value claim only; no forecast, causation, or advice |
| F02 | Same data but missing rights snapshot/content hash | `stop` | Connector/input cannot enter evidence despite plausible facts |
| F03 | Expired weather-like advisory presented as current | `reject` | Freshness follows `expires`/revision, not retrieval time |
| F04 | Two current official products materially contradict one value | `hold` | Generator is never asked to reconcile the contradiction |
| F05 | Three reports all derived from one upstream dataset or statement | `hold` | Independence count equals one |
| F06 | Two distinct authorities for a comparison, each with complete provenance, while prose adds unsupported causation | `reject` | Post-generation claim validation rejects the entire script version |
| F07 | Discovery aggregator contains a claim also absent from admitted evidence | `reject` | Discovery content never enters the brief or generation prompt |
| F08 | Authority feed links third-party media without rights | `reject` | Official hosting does not transfer third-party reuse rights |
| F09 | NASA-like authority reports its own mission status | `eligible` | Eligibility is limited to the authority's own action/status |
| F10 | NASA-like release summarizes an external paper that is not admitted | `hold` | Resolve to original primary evidence; authority news is not independent validation |
| F11 | GDACS-like record and USGS-like record share USGS upstream measurements | `hold` | They count as one origin for the shared earthquake fact |
| F12 | Earthquake event receives a later revision and tombstone | `reject` old / `hold` reassessment | Old version cannot support new publication; affected cluster re-evaluates |
| F13 | Current-affairs lead has an official statement but no admitted independent corroborator | `hold` then `reject` | Broad current-affairs segment remains blocked |
| F14 | Economic script gives a buy/sell/hold recommendation from valid statistics | `reject` | Financial recommendations are prohibited regardless of evidence |
| F15 | Medical advice, election poll, emergency instruction, unconfirmed crime, or live conflict casualty input | `reject` | Approved MVP exclusions cannot be re-enabled by source confidence |
| F16 | Missing provenance store or unknown policy-service result | `stop` | A critical gate failure stops the affected path |
| F17 | Valid script lacks audible or visible AI disclosure | `stop` | Publication boundary cannot be crossed |
| F18 | Material factual error discovered after publication | `withdrawn` then corrected version | Public playback stops immediately; internal audit stays immutable |
| F19 | 08:00 edition requested at 23:59:59.999 after 18:00 edition was held | `replay` | Audible/visible original timestamp and no-newer-verified-edition disclosure present |
| F20 | Same edition requested at 00:00, exactly 16 hours after original publication | `expired` | Boundary is exclusive; visible unavailable status, no audio, no filler, and no direct-asset bypass |
| F21 | Latest edition withdrawn; older unaffected edition is 15 hours old | `replay` | Fallback uses the older edition's own window and disclosure |
| F22 | Latest edition withdrawn; older unaffected edition is 16 hours old | `expired` | Withdrawal cannot extend or reset an older timestamp; the player shows unavailable status and serves no audio |
| F23 | Synthetic privacy incident affecting subject rights | `stop` and incident workflow | Immutable incident clock; ANPD and subject notification decisions occur within 48-hour procedure |
| F24 | Processor reports a synthetic privacy incident immediately | `stop` and escalation | Controller receives enough data to assess Articles 34–36 duties |

## Fixture construction rules

- Replace real names and personal data with synthetic values.
- Use small authored records or public-domain/explicit-license samples with a stored license artifact.
- Never copy current news articles into fixtures without source-specific permission.
- Freeze clocks so edition and source-product boundaries are reproducible.
- Model upstream origins explicitly; different URLs are not automatically independent.
- Include revisions, deletions, and malformed metadata—not only happy paths.
- Assert that rejected and discovery-only content is absent from generator inputs.

## Implemented evidence-package cases

The private harness and unit suite now exercise deterministic evidence-package assembly alongside the admission cases. These are engineering cases, not claims that the corresponding end-to-end core fixtures have passed.

| ID | Assembly behavior |
| --- | --- |
| EP01–EP04 | Eligible assembly, non-eligible refusal, decision re-evaluation, and discovery exclusion |
| EP05–EP07 | Claim-link requirements, unknown references, and duplicate identities |
| EP08 | Current-affairs E1/E2 independence recomputed from terminal origin roots |
| EP09–EP10 | Permutation-invariant identity, canonical bytes, deep freezing, and caller-input detachment |
| EP11–EP12 | Snapshot consistency and missing-node, cyclic, or ambiguous origin-graph rejection |

Package hashes prove byte identity, not factual truth, legal authorization, or semantic claim support. Semantic claim validation remains future Phase 1 work.

## Implemented audit-lineage cases

The audit unit and PostgreSQL integration suites use synthetic packages only. They exercise infrastructure invariants, not editorial truth.

| ID | Audit behavior |
| --- | --- |
| AL01–AL03 | Exact canonical artifact bytes, stable content/event hashes, append preparation, and idempotent replay semantics |
| AL04–AL06 | Modified-event, gap, duplicate/fork, previous-hash, and sequence validation |
| AL07–AL09 | Missing or modified artifact, package-lineage mismatch, trusted-head tail truncation, and immutable package reconstruction |
| AL10 | Malformed, null, rejected, or failed audit-store reads return typed boundary failures instead of throwing |
| PG01–PG03 | Migration privileges, reconnect durability, serialized concurrent append, and expected-head conflict |
| PG04–PG06 | Idempotent replay, conflicting key rejection, and blocked update/delete/truncate/mutation upsert attempts |
| PG07–PG09 | Artifact collision handling, atomic rollback without orphan artifacts, and reconstruction after reconnect |

Verification requires a trusted expected stream head. Complete deletion cannot be detected when the only trusted head is deleted with the same database; independent anchoring and production recovery controls are not implemented.

## Exit evidence

Phase 1 cannot claim success until the harness proves:

- every case produces the expected machine-readable outcome and reason;
- no `hold`, `reject`, `stop`, discovery-only, or withdrawn item reaches generation/playback;
- every eligible material claim maps to retained evidence and one independence graph;
- replay and withdrawal decisions are enforced per playback request; and
- audit reconstruction includes input fingerprints, rights evidence, policies, decisions, script/audio versions, and operator actions.

A private synthetic harness is implemented and tested for the admission and evidence-package cases described above. An explicit database-backed audit harness persists, reconnects, verifies, and reconstructs one synthetic package. Real connectors remain non-active, the broader F01–F24 exit evidence is incomplete, and the Phase 1 exit gate has not passed.
