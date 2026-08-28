# Novaris News product requirements

## Product definition

Novaris News is an autonomous, audio-first news service launching in Spanish for Peru and Latin America, with coverage of major worldwide events relevant to that audience. It turns corroborated reporting from approved sources into short, sourced, AI-narrated bulletins. Routine publication does not require human approval; automated evidence and safety gates decide whether an item may proceed.

## Goals

- Help listeners in Peru and Latin America understand major regional and worldwide events without continuously monitoring many outlets.
- Publish two timely, concise Spanish audio bulletins each day across the approved launch categories.
- Make the AI origin, supporting sources, and later corrections clear to the audience.
- Operate autonomously while failing closed when evidence or critical controls are insufficient.
- Establish an MVP that can later support continuous programming and topic-specific channels.

## Non-goals for the MVP

- A full television or video news channel.
- Guaranteed 24/7 live programming.
- Original on-the-ground reporting or interviews.
- Opinion, endorsements, personalized political persuasion, or entertainment programming.
- User-selectable topic channels or configurable delivery tone.
- Numerical accuracy or confidence percentages without a calibrated methodology.
- A claim of complete truth, neutrality, or legal compliance.

## Primary personas

| Persona | Need | MVP outcome |
| --- | --- | --- |
| General listener | A quick overview of important events | Plays a current, concise bulletin |
| Context-seeking listener | Evidence behind a reported claim | Opens the item and sees its supporting sources |
| Returning listener | Changes since an earlier report | Sees and hears clearly linked updates or corrections |
| Operator | Detects unsafe or degraded automation | Monitors alerts and can activate a system-wide kill switch |

## MVP scope

### Included

- Two 5–10 minute Spanish audio bulletins daily at 08:00 and 18:00 `America/Lima`.
- Current affairs in Peru, Latin America, and the world.
- General economics without financial recommendations.
- Technology and science.
- Climate and environment.
- Major public-interest events.
- An approved, configurable source catalog.
- Official primary sources as the publication-evidence base; rights-verified established media only as corroboration.
- Aggregators and social networks restricted to discovery and excluded from publication evidence.
- Automated ingestion, normalization, language detection, and deduplication.
- Cross-source corroboration and risk classification before script generation.
- Automated prioritization of sufficiently supported stories.
- Factual script generation constrained to retained evidence.
- Text-to-speech narration and scheduled web-audio playback.
- Visible and audible AI disclosure.
- Per-item source links, publication timestamps, and correction history.
- Operational monitoring, audit records, and a kill switch.

### Deferred

- Unconfirmed crime until deterministic verification and reputational-risk controls exist.
- Medical advice until deterministic health-evidence and wording controls exist.
- Election polling until deterministic electoral restrictions and metadata controls exist.
- Emergency alerts until deterministic authority, freshness, and geographic controls exist.
- Live conflict casualty figures until deterministic source, freshness, and contradiction controls exist.
- Continuous 24/7 programming.
- Video presenters, visual packages, and television distribution.
- Topic channels selected by the user.
- Configurable tone or presenter personality.
- Personalized feeds and recommendations.
- Confidence percentages.
- Original reporting workflows and human editorial desks.

## Functional requirements

| ID | Requirement |
| --- | --- |
| FR-01 | The system shall ingest only from sources present in the active source catalog and shall keep discovery-only inputs outside publication evidence packages. |
| FR-02 | The system shall preserve the source URL, publisher, author when available, publication time, retrieval time, content fingerprint, and usage rights metadata for every input. |
| FR-03 | The system shall normalize and cluster substantially overlapping reports before treating them as independent evidence. |
| FR-04 | Every material claim shall map to an admitted official primary source within its authority; when policy requires corroboration, established media sources shall count only after rights verification and only across distinct independence groups. |
| FR-05 | The system shall classify topic and risk before deciding whether a story may be generated. |
| FR-06 | The system shall suppress an item when its evidence, provenance, freshness, or safety status does not satisfy policy. |
| FR-07 | The system shall rank eligible items using public-interest relevance, recency, geographic breadth, and urgency without allowing engagement alone to determine priority. |
| FR-08 | The system shall generate scripts using only approved evidence attached to the story record. |
| FR-09 | The system shall generate narration and assemble it into two 5–10 minute Spanish audio bulletins scheduled daily at 08:00 and 18:00 `America/Lima`. |
| FR-10 | Every bulletin shall contain an audible AI disclosure, and every playback surface shall contain a visible disclosure. |
| FR-11 | Every published item shall expose its supporting sources and distinguish reporting time from event time when known. |
| FR-12 | The system shall detect materially changed evidence and publish a linked update or correction without silently rewriting history. |
| FR-13 | An authorized operator shall be able to stop new publication and playback through a kill switch. |
| FR-14 | The system shall retain an audit trail of inputs, policy decisions, generated scripts, audio versions, publications, and corrections. |
| FR-15 | The system shall hold or reject an item when required evidence is insufficient or materially contradictory, without resolving the gap through generation. |

## Source and evidence policy

| Tier | Permitted role | Admission rule |
| --- | --- | --- |
| `E1` — official primary | Publication evidence for claims within the source's authority | Identity, official remit, endpoint, permitted use, attribution, retention, review date, and independence group are documented; status is `approved_evidence` |
| `E2` — established media | Corroboration only | Editorial owner, endpoint, permitted use, attribution, retention, review date, and upstream independence are documented; status is `approved_evidence` |
| `D` — discovery | Lead generation only | May enter the discovery queue, but its content cannot enter an evidence package or support a published claim |

Aggregators and social networks are always tier `D`, including posts that appear to come from official accounts. The pipeline must resolve a lead to an admitted official record or endpoint before it can become evidence. Multiple reports owned by the same group or derived from the same wire, statement, dataset, or upstream report count as one independence group.

Missing rights evidence, expired verification, or unknown attribution prevents evidence admission. Insufficient evidence or an unresolved material contradiction produces `hold` while resolution remains possible and `reject` when the applicable window or policy cannot be satisfied. A policy or provenance dependency failure stops the affected publication path.

## Nonfunctional requirements

- **Safety:** default to omission when evidence or policy evaluation is unavailable.
- **Traceability:** a published sentence must be traceable to retained source evidence and a pipeline version.
- **Availability:** degradation in a noncritical source must not corrupt other stories; failure of a critical safety dependency stops affected publication.
- **Recoverability:** jobs must be idempotent or safely replayable without duplicate bulletins.
- **Security:** source credentials, operator controls, and audit records require least-privilege access and tamper-evident handling.
- **Privacy:** avoid collecting listener data not required for playback and operations; redact unnecessary personal data from internal artifacts.
- **Accessibility:** playback controls and written story summaries must support keyboard and assistive-technology use; audio content needs a readable transcript.
- **Observability:** each pipeline stage must emit structured status, latency, policy outcome, and error signals.
- **Internationalization:** the MVP shall publish in Spanish; data objects must support additional languages without weakening evidence or safety rules.

## MVP acceptance criteria

- Given admitted evidence and discovery-only leads, the system produces a deduplicated story cluster while excluding discovery-only content from its evidence package.
- Syndicated copies or reports with a shared upstream origin count as one independence group.
- A story lacking required corroboration never reaches script, narration, or publication stages.
- A generated script contains no material factual claim without attached evidence.
- A published bulletin is playable on the web and has a readable transcript.
- AI disclosure is audible within the bulletin and visible before or during playback.
- Each item exposes source links and timestamps.
- A material source update creates a linked correction or update and preserves the prior version.
- Activating the kill switch prevents new publication and follows a defined action for currently scheduled content.
- Operators can reconstruct why an item was published or rejected from the audit trail.
- A critical policy, provenance, or corroboration dependency failure causes affected items to fail closed.

## Success metrics

Initial targets must be set after source availability is confirmed. The MVP should measure:

- percentage of published material claims traceable to retained evidence;
- unsupported-claim escape rate found by sampled post-publication audits;
- correction frequency and median time from new evidence to correction;
- duplicate-story rate;
- time from sufficient corroboration to publication;
- bulletin completion and replay rates;
- availability of playback and provenance surfaces;
- frequency, duration, and cause of automated publication stops.

These metrics assess process quality. They must not be presented as a universal probability that a story is true.

## Key risks

| Risk | Required response |
| --- | --- |
| Fabricated or distorted claims | Evidence-constrained generation, sentence-level provenance, and fail-closed validation |
| Many outlets repeat one erroneous origin | Source-independence analysis and identification of common upstream reporting |
| Defamation, privacy harm, or unsafe emergency guidance | Stricter topic gates, official-primary-source requirement, minimization, and automated stop rules |
| Synthetic presenter is mistaken for a person | Persistent visible and audible AI disclosure |
| Corrections do not reach prior listeners | Versioned items, prominent correction surfaces, and correction segments in later bulletins |
| Source use violates rights or terms | Licensed/authorized source catalog and retained rights metadata |
| Geographic or political bias | Source-diversity monitoring and documented prioritization policy |
| Autonomy amplifies failures at scale | Rate limits, canary publication, anomaly detection, and global/segment kill switches |

## Open decisions

1. Final legal jurisdiction and counsel-confirmed requirements for the Peru/Latin America launch.
2. Source-registry population, source-by-source rights verification, and review frequency.
3. Bulletin freshness, replay, and retention policy.
4. Distribution surface and the precise meaning of a future 24/7 service.
5. Monetization and its separation from editorial prioritization.
6. Governance ownership, incident response, and operator access model.
7. Measurable launch thresholds for quality, latency, and availability.
8. Technology stack and hosting model.

## Phased roadmap

The [implementation plan](IMPLEMENTATION_PLAN.md) defines delivery work and exit gates; the [Phase 0 foundations](PHASE_0_FOUNDATIONS.md) track the product, legal, and editorial decisions required before implementation. This summary preserves the six-phase terminology without replacing those documents.

| Phase | Outcome |
| --- | --- |
| 0 — Foundations | Resolve operating rules, source rights, cadence, categories, accountable roles, and public-launch blockers. |
| 1 — Evidence-pipeline spike | Prove evidence packages, grounded scripts, rejection behavior, and claim-level lineage on private fixtures. |
| 2 — Reproducible bulletin | Produce a private, versioned audio bulletin with transcript, sources, disclosure, and reproducible lineage. |
| 3 — Shadow operation | Run private bulletins and audit sufficient claims to measure whether the public-beta gates are satisfied. |
| 4 — Public beta | Publish a constrained Spanish general-news service for Peru and Latin America, including relevant worldwide events. |
| 5 — Continuous operation | Increase cadence only after quality gates pass, then evaluate audience choice, richer formats, and additional languages. |
