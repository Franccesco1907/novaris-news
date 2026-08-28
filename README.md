# Novaris News

Novaris News is an early-stage concept for an autonomous, AI-run news service that helps a global audience follow important events. The MVP is an audio-first web radio that produces sourced news bulletins without a routine human approval step.

> [!WARNING]
> This repository contains planning and a private, synthetic Phase 1 engineering spike. Novaris News is not production-ready and must not be treated as a reliable news source.

## Current status

**Phase 1 — Evidence-pipeline spike has started while Phase 0 launch blockers remain open.** The private slices validate synthetic evidence-admission inputs, produce deterministic `eligible`, `hold`, `reject`, or `stop` decisions, and assemble immutable content-addressed evidence packages for eligible cases. They have no real connectors, database, model call, audio, scheduler, public API, or publication path, and they do not yet cover all 24 fixture cases.

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

## Development quick path

The current workspace requires Node.js 24 and uses the package manager version pinned in `package.json`.

```bash
nvm use
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm test
corepack pnpm harness
```

The harness is deterministic and private. It calls no external API or language model and exits nonzero when an implemented synthetic case disagrees with its expected outcome.

## Principles

1. **Autonomous does not mean ungoverned.** Publication has no routine human approval gate, but automated editorial and safety gates are mandatory.
2. **Evidence before fluency.** A polished script never compensates for weak sourcing.
3. **Traceability by default.** Every published item must retain the sources and transformations behind it.
4. **Visible AI identity.** Disclosure belongs with the content, not only in legal terms.
5. **Safe failure.** When evidence or critical infrastructure is uncertain, the system stops or omits the item rather than improvising.

## Open decisions

The immediate engineering work is to expand the evidence pipeline toward complete fixture coverage, durable audit lineage, bounded script generation, and semantic claim validation without admitting real sources prematurely. In parallel, connector admission, responsible roles, procedure tests, and the counsel/authority questions in the [Phase 0 exit checklist](docs/PHASE_0_FOUNDATIONS.md#exit-checklist) remain mandatory. Nothing in the current slice permits public launch or real-source publication.
