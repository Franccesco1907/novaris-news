# Phase 0 — Product, legal, and editorial foundations

## Status

**IN PROGRESS — started 2026-08-28.**

Phase 0 defines the constraints under which Novaris News may be designed and tested. It is not legal advice, and it does not declare the product compliant. Peruvian counsel and, where applicable, the relevant authorities must confirm the open legal questions before public launch.

## Confirmed decisions

| Area | Decision |
| --- | --- |
| Product | Novaris News |
| MVP format | Audio-first web radio; full television is outside the MVP |
| Operating model | Autonomous publication without routine human approval |
| Language | Spanish |
| Initial market | Peru and Latin America |
| Coverage horizon | Major worldwide events relevant to the initial audience |
| Governance | Automated gates, post-generation audit, a responsible human operator, and a kill switch are mandatory |
| Disclosure | AI involvement must be disclosed visibly and audibly |
| Confidence display | No public numerical confidence score until the method is calibrated and validated |
| Failure principle | Remain silent, hold, or reject rather than improvise when evidence is insufficient |

Autonomy describes the normal publication flow. It does not remove legal responsibility, human accountability, incident response, or the operator's ability to stop and correct the system.

## Verified requirements baseline

The following requirements are derived from official Peruvian sources. They are a product-design baseline, not a final legal interpretation.

### Expression, responsibility, and personality rights

Article 2, sections 4 and 7 of the [Political Constitution of Peru](https://www.gob.pe/institucion/minjus/informes-publicaciones/7498785-vigesima-primera-edicion-oficial-de-la-constitucion-politica-del-peru-bolsillo-actualizada-al-05-de-diciembre-de-2025) protect freedoms of information and expression subject to legal responsibility, and protect honor, reputation, personal and family privacy, voice, and image.

**Product requirement:** preserve accountability for publication; apply stricter controls to allegations and identifiable people; minimize personal information; and prevent synthetic voices or images from implying a real person's participation without authorization.

### Rectification workflow

[Law 26775 as amended by Law 26847](https://www.leyes.congreso.gob.pe/documentos/Leyes/26847.pdf) establishes rectification duties for affected persons. The amended text includes identification of a director or responsible party and an address for rectification requests; it sets a 15-calendar-day request period and, for daily media, a seven-day publication deadline.

**Product requirement:** every edition or emission and the website must identify the responsible party and rectification channel; intake timestamps must be immutable; the workflow must route, decide, publish, and evidence rectifications within the applicable deadline. Counsel must confirm how these provisions apply to this internet-native format.

### Defamation and synthetic media

[Law 32314](https://leyes.congreso.gob.pe/Documentos/2021_2026/ADLP/Texto_Consolidado/32314-TXM.pdf) updates the Penal Code to expressly address certain false or denigrating defamatory content created or manipulated with AI, including deepfakes.

**Product requirement:** prohibit impersonation and fabricated quotations; use deterministic high-risk gates for accusations and reputational claims; retain source and generation lineage; and stop publication when identity, attribution, or evidentiary support is uncertain.

### Copyright and source use

[Legislative Decree 822](https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/00822.pdf) distinguishes unprotected facts, data, and news of the day from protected journalistic expression and audiovisual works. Quotation, attribution, and other statutory conditions still apply.

**Product requirement:** extract and restate facts from authorized evidence without copying protected expression unnecessarily; do not reuse source photos, audio, video, article text, or distinctive presentation without a documented legal basis; retain license or terms evidence and attribution rules in the source registry.

### Personal data

[Law 29733](https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales/243470-29733) and its updated regulation, [Supreme Decree 016-2024-JUS](https://cdn.www.gob.pe/uploads/document/file/7568330/6426760-decreto-supremo-n-016-2024-jus-reglamento-de-la-ley-n-29733-ley-de-proteccion-de-datos-personales-publicado-nov-2024.pdf), govern personal-data processing. The availability of information from public sources does not eliminate proportionality, security, or data-subject-rights analysis; incident duties and data-bank inventory or registration may apply.

**Product requirement:** minimize listener and source-subject data; document purposes and retention; secure operational and audience data; provide rights-request and incident workflows; and determine whether any personal-data banks require registration.

### AI governance

[Supreme Decree 115-2025-PCM](https://busquedas.elperuano.pe/dispositivo/NL/2436426-1), which regulates Peru's AI law, establishes principles and obligations involving transparency, accountability, privacy, copyright, and human supervision.

**Product requirement:** identify AI-generated content, document accountable roles and system limitations, preserve auditability, assess the final use-case risk classification, and ensure an authorized person can stop or correct the system. Human supervision does not necessarily mean routine prepublication approval, but counsel must confirm the control model for this use case.

### Election content

Peru's current electoral rules include specific restrictions for publishing election surveys; see the official [2025 regulation publication](https://busquedas.elperuano.pe/dispositivo/NL/2381011-1).

**Product requirement:** election-survey embargoes, required metadata, attribution, and other time-based restrictions must be implemented as deterministic, versioned policy rules. They must not depend only on prompt instructions.

### Internet-radio authorization

[Law 28278, the Radio and Television Law](https://leyes.congreso.gob.pe/Documentos/Leyes/28278.pdf), regulates services that use the radio spectrum. An internet-only audio service appears to fall outside terrestrial spectrum authorization, but this interpretation must be confirmed with Peruvian counsel and, if necessary, the Ministry of Transport and Communications before launch.

**Product requirement:** the MVP must remain internet-only unless the required broadcast authorization is confirmed. Distribution architecture must not silently expand into regulated spectrum use.

## Recommended controls

These controls translate the baseline into an autonomous operating model. Final thresholds remain open until Phase 1 and Phase 3 provide evidence.

| Control area | Minimum control |
| --- | --- |
| Source admission | Allow only active registry entries with verified identity, rights status, attribution, rate limits, and review date |
| Evidence | Map every material claim to retained evidence; evaluate source independence and common upstream origins |
| High-risk topics | Use stricter, deterministic rules, authoritative-primary-source preference, shorter freshness windows, and fail-closed outcomes |
| Script generation | Give the model only the bounded evidence package; reject any unsupported factual addition |
| Identity and reputation | Prohibit impersonation, invented quotations, and unsupported allegations; minimize private-person identification |
| Copyright | Store permitted uses and attribution; avoid reproducing protected expression or media without an explicit basis |
| Privacy | Minimize collection, separate audience analytics from editorial evidence, encrypt sensitive data, and enforce retention |
| Elections | Encode survey and election restrictions in dated policies maintained for the relevant election calendar |
| Disclosure | Place plain-language AI disclosure in the audio and next to the player; preserve it in distributed artifacts where feasible |
| Corrections | Provide an accessible request address, immutable intake time, responsible owner, deadline tracking, versioned public correction, and prior-version preservation |
| Operations | Authenticate the responsible operator; provide global publication stop, scoped stops, incident alerts, and auditable recovery |
| Confidence | Keep internal evidence signals separate from public truth claims; publish no percentage until calibrated and user-tested |

## High-risk policy areas

Before any public beta, define versioned rules for:

- elections, voting procedures, surveys, and political violence;
- armed conflict, terrorism, and rapidly changing security events;
- public-health instructions and medical claims;
- disasters, evacuations, missing persons, and emergency directions;
- allegations of crime, corruption, misconduct, or abuse;
- deaths, casualties, minors, private individuals, and sensitive personal data;
- market-moving financial claims and consumer financial harm;
- synthetic media, impersonation, and claims involving voice or image rights.

Each rule must state permitted evidence types, required independence, freshness, wording limits, prohibited outputs, correction behavior, and the exact `hold`, `reject`, or `stop` conditions.

## Source registry template

Every discovery or evidence source needs a record. Discovery-only status does not authorize its content as publication evidence.

| Field | Required meaning |
| --- | --- |
| `source_id` | Stable internal identifier |
| `owner` | Legal or editorial owner |
| `country` | Primary jurisdiction or coverage country |
| `source_type` | Primary authority, wire, publisher, specialist, local outlet, public record, aggregator, social, or other controlled value |
| `url_feed_api` | Canonical website and exact collection endpoint |
| `license_terms_evidence` | URL, contract reference, permission record, or dated terms snapshot supporting use |
| `allowed_uses` | Discovery, factual extraction, quotation, summarization, storage, publication linking, audio use, or other explicit permissions |
| `attribution` | Required public credit and linking format |
| `retention` | What content and metadata may be retained, and for how long |
| `rate_limits` | Contractual and technical collection limits |
| `independence_group` | Known owner, wire, syndication, or common-origin grouping |
| `topic_risk_tier` | Permitted topics and any topic-specific restrictions |
| `verification_date` | Date on which identity, terms, and endpoint were last checked |
| `status` | `proposed`, `discovery_only`, `approved_evidence`, `suspended`, `revoked`, or `expired` |

Example skeleton:

```yaml
source_id: ""
owner: ""
country: ""
source_type: ""
url_feed_api: ""
license_terms_evidence: ""
allowed_uses: []
attribution: ""
retention: ""
rate_limits: ""
independence_group: ""
topic_risk_tier: []
verification_date: "YYYY-MM-DD"
status: "proposed"
```

## Open product decisions

The next decision is the **initial bulletin cadence and category set**. Resolve it before designing the Phase 1 fixtures.

| Decision | Required output |
| --- | --- |
| Cadence | Editions per day, target publication times, time zone, target duration, freshness window, and replay behavior |
| Categories | The permitted launch categories and categories deferred because their risk rules are not ready |
| High-risk participation | Whether politics, elections, public safety, health, crime, conflict, and finance appear in the first private evaluation or are phased in |
| Source breadth | Minimum independent sources and primary-source requirements by category |
| Responsible operation | Named publisher/operator role, kill-switch authority, escalation backup, and service coverage hours |
| Corrections | Public address, intake ownership, response workflow, notification method, and retention |
| Data | Audience analytics scope, consent model, retention periods, data-bank inventory, and security owner |
| Business model | Whether advertising, sponsorship, or subscriptions exist and how they remain isolated from editorial ranking |

### Recommended starting point for the next decision

For the private phases, start with two 5–10 minute bulletins per day in `America/Lima`. Evaluate a narrow general set—world affairs, economy, technology/science, climate/environment, and major public-interest events—while allowing elections, emergencies, allegations, health instructions, conflict, and market-moving claims only when their deterministic policies and source requirements are explicitly ready.

This is a recommendation, not a confirmed decision.

## Counsel-required questions

Before public launch, obtain written advice or authoritative confirmation for:

1. the legal entity and responsible publisher/editor required for an autonomous internet news service;
2. the required identity and address disclosures and exact rectification procedure for web pages, audio editions, feeds, and archived items;
3. whether an internet-only radio service requires any MTC authorization, registration, or notice;
4. the permitted collection, extraction, summarization, quotation, storage, and redistribution model for each source class;
5. the applicable privacy roles, data-bank inventory or registration, international transfers, security duties, and incident notifications;
6. the final risk classification and human-supervision obligations under Peru's AI regulation;
7. consumer-protection and digital-service implications of subscriptions, advertising, sponsorships, recommendations, or user accounts;
8. election-period obligations, including survey publication, silence periods, attribution, archives, and correction timing;
9. liability and response duties for defamation, privacy, voice/image misuse, synthetic media, and harmful automated repetition;
10. retention rules for source copies, model inputs and outputs, audit logs, rectification requests, and withdrawn audio.

## Exit checklist

- [x] Product name, language, initial market, coverage horizon, and audio-first scope are recorded.
- [x] Autonomous operation, AI disclosure, post-generation audit, accountable operator, and kill switch are product requirements.
- [x] Public numerical confidence scores are deferred until calibrated.
- [ ] Initial bulletin cadence, duration, time zone, freshness, and replay policy are approved.
- [ ] Initial category set and deferred high-risk categories are approved.
- [ ] A source registry exists with rights evidence for every Phase 1 input.
- [ ] Topic-specific evidence, freshness, contradiction, and stop rules are approved for the Phase 1 categories.
- [ ] Responsible publisher/operator roles, rectification address, kill-switch authority, and incident escalation are assigned.
- [ ] Correction, complaint, withdrawal, and rectification procedures are documented and tested.
- [ ] Privacy inventory, retention schedule, security owner, and incident procedure are documented.
- [ ] Counsel-required questions have written answers or explicit launch blockers.
- [ ] Phase 1 fixtures and success criteria reflect the approved categories and policies.

Phase 0 completes only when all unchecked items are resolved. Product experimentation may continue privately, but unresolved legal, source-rights, accountability, or safety items block public launch.

## Decision log

| Date | Decision | Status | Rationale |
| --- | --- | --- | --- |
| 2026-08-28 | Name the product Novaris News | Confirmed | Serious, global identity that does not constrain future formats |
| 2026-08-28 | Launch the MVP in Spanish for Peru and Latin America | Confirmed | Defines the first audience and regulatory baseline |
| 2026-08-28 | Cover major worldwide events relevant to the initial audience | Confirmed | Preserves global scope while making prioritization audience-aware |
| 2026-08-28 | Build audio-first web radio, not full television | Confirmed | Tests the editorial core before adding video complexity |
| 2026-08-28 | Operate autonomously without routine human approval | Confirmed | Autonomy is a product requirement, bounded by automated gates and human stop/correction authority |
| 2026-08-28 | Require visible and audible AI disclosure | Confirmed | A terms-only disclaimer is insufficient for informed use |
| 2026-08-28 | Defer public numerical confidence scores | Confirmed | An uncalibrated percentage would create false precision |
| 2026-08-28 | Decide cadence and categories next | Open | These choices determine source selection, fixtures, risk rules, and the Phase 1 test surface |

## Next decision

Approve the initial bulletin cadence and category set. That decision unlocks source-registry population, topic-specific policies, and Phase 1 evidence fixtures.
