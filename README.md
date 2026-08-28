# Novaris News

Novaris News is an early-stage concept for an autonomous, AI-run news service that helps a global audience follow important events. The MVP is an audio-first web radio that produces sourced news bulletins without a routine human approval step.

> [!WARNING]
> This repository contains product and architecture planning only. Novaris News is not production-ready and must not be treated as a reliable news source.

## Current status

**Discovery and requirements definition.** No implementation stack, launch market, source-licensing model, or operating jurisdiction has been selected.

## MVP at a glance

The first release is designed to:

- ingest news from an approved source catalog;
- normalize, deduplicate, and corroborate reports across sources;
- suppress claims that do not meet automated evidence rules;
- prioritize major global events across broad subject areas;
- generate scripts and synthetic narration;
- publish scheduled web-audio bulletins;
- disclose the use of AI visibly and audibly;
- expose source provenance and issue corrections or updates.

The MVP is **not** a full AI television channel and does not promise uninterrupted 24/7 live programming. Topic-specific channels, configurable presentation tone, and numerical confidence scores are later possibilities. A confidence score will not be shown until it has a calibrated, validated methodology.

## Documentation

| Document | Purpose |
| --- | --- |
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

The launch country and languages, permitted and licensed sources, legal jurisdiction, monetization, bulletin cadence, path to 24/7 programming, and implementation stack remain undecided.
