# Novaris News

Novaris News is an early-stage concept for an autonomous, AI-run news service that helps a global audience follow important events. The MVP is an audio-first web radio that produces sourced news bulletins without a routine human approval step.

> [!WARNING]
> This repository contains product and architecture planning only. Novaris News is not production-ready and must not be treated as a reliable news source.

## Current status

**Phase 0 — Foundations is documented but incomplete.** The MVP is Spanish-language, audio-first web radio for Peru and Latin America, covering major worldwide events relevant to that audience. It will publish two 5–10 minute bulletins daily at 08:00 and 18:00 `America/Lima`. Lifecycle, source-registry, topic-policy, correction, privacy, legal-review, and fixture baselines now exist, but every connector is non-active, accountable identities are unassigned, procedures are untested, and counsel/authority launch questions remain open.

## MVP at a glance

The first release is designed to:

- ingest news from an approved source catalog;
- normalize, deduplicate, and corroborate reports across sources;
- suppress claims that do not meet automated evidence rules;
- prioritize major global events across broad subject areas;
- generate scripts and synthetic narration;
- publish scheduled web-audio bulletins twice daily;
- disclose the use of AI visibly and audibly;
- expose source provenance and issue corrections or updates.

The MVP is **not** a full AI television channel and does not promise uninterrupted 24/7 live programming. Topic-specific channels, configurable presentation tone, and numerical confidence scores are later possibilities. A confidence score will not be shown until it has a calibrated, validated methodology.

Initial coverage includes current affairs in Peru, Latin America, and the world; general economics without financial recommendations; technology and science; climate and environment; and major public-interest events. Unconfirmed crime, medical advice, election polling, emergency alerts, and live conflict casualty figures are excluded until deterministic controls exist.

Publication evidence must originate from an admitted official primary source. An admitted established media source may corroborate that evidence only after its identity, permitted use, attribution, and independence group are verified. Aggregators and social networks may identify leads, but their content is never publication evidence. Unresolved contradictions or insufficient evidence cause the affected item to be held or rejected.

## Documentation

| Document | Purpose |
| --- | --- |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) | Phased delivery sequence, measurable gates, and comparable product signals |
| [Phase 0 foundations](docs/PHASE_0_FOUNDATIONS.md) | Confirmed decisions, Peru requirements baseline, source registry, open legal questions, and exit checklist |
| [Product requirements](docs/PRODUCT_REQUIREMENTS.md) | MVP boundaries, requirements, acceptance criteria, metrics, and roadmap |
| [Logical architecture](docs/ARCHITECTURE.md) | Technology-independent system boundaries, data flow, and failure behavior |
| [Editorial safety](docs/EDITORIAL_SAFETY.md) | Automated evidence, disclosure, provenance, correction, and stop rules |
| [Bulletin lifecycle](docs/BULLETIN_LIFECYCLE.md) | Sixteen-hour replay window, request-time eligibility, withdrawal, and silence rules |
| [Topic evidence policies](docs/TOPIC_EVIDENCE_POLICIES.md) | Deterministic category thresholds, freshness, independence, and fail-closed outcomes |
| [Source registry](config/source-registry.yaml) | Machine-readable non-production source candidates, rights evidence, and admission blockers |
| [Corrections and incidents](docs/CORRECTIONS_AND_INCIDENTS.md) | Severity model, rectification baseline, withdrawal, escalation, and recovery runbook |
| [Privacy and retention](docs/PRIVACY_AND_RETENTION.md) | Data inventory, security document, incident procedure, and unresolved retention schedule |
| [Legal review checklist](docs/LEGAL_REVIEW_CHECKLIST.md) | Confirmed official sources, product inferences, and counsel/authority blockers |
| [Phase 1 fixtures](docs/PHASE_1_FIXTURES.md) | Synthetic and rights-cleared cases with expected eligible/hold/reject/stop outcomes |

## Principles

1. **Autonomous does not mean ungoverned.** Publication has no routine human approval gate, but automated editorial and safety gates are mandatory.
2. **Evidence before fluency.** A polished script never compensates for weak sourcing.
3. **Traceability by default.** Every published item must retain the sources and transformations behind it.
4. **Visible AI identity.** Disclosure belongs with the content, not only in legal terms.
5. **Safe failure.** When evidence or critical infrastructure is uncertain, the system stops or omits the item rather than improvising.

## Open decisions

The immediate work is to test and legally admit selected connectors, assign responsible publisher/operator/privacy/security roles, exercise correction and incident procedures, and obtain the counsel/authority answers listed in the [Phase 0 exit checklist](docs/PHASE_0_FOUNDATIONS.md#exit-checklist). The documented foundation permits private synthetic-fixture engineering; it does **not** permit public launch or real-source publication.
