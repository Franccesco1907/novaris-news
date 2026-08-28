# Novaris News

Novaris News is an early-stage concept for an autonomous, AI-run news service that helps a global audience follow important events. The MVP is an audio-first web radio that produces sourced news bulletins without a routine human approval step.

> [!WARNING]
> This repository contains product and architecture planning only. Novaris News is not production-ready and must not be treated as a reliable news source.

## Current status

**Phase 0 — Foundations is in progress.** The MVP is Spanish-language, audio-first web radio for Peru and Latin America, covering major worldwide events relevant to that audience. It will publish two 5–10 minute bulletins daily at 08:00 and 18:00 `America/Lima`. The source and evidence policy is confirmed; registry population, accountable operating roles, and counsel-confirmed launch requirements remain open.

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

## Principles

1. **Autonomous does not mean ungoverned.** Publication has no routine human approval gate, but automated editorial and safety gates are mandatory.
2. **Evidence before fluency.** A polished script never compensates for weak sourcing.
3. **Traceability by default.** Every published item must retain the sources and transformations behind it.
4. **Visible AI identity.** Disclosure belongs with the content, not only in legal terms.
5. **Safe failure.** When evidence or critical infrastructure is uncertain, the system stops or omits the item rather than improvising.

## Open decisions

The immediate work is to populate and verify the source registry, then approve bulletin lifecycle and topic-specific evidence thresholds. Responsible publisher/operator roles, correction and privacy procedures, counsel-confirmed Peruvian obligations, monetization, and the implementation stack also remain open. See the [Phase 0 exit checklist](docs/PHASE_0_FOUNDATIONS.md#exit-checklist).
