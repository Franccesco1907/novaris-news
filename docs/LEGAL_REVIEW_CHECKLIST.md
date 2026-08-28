# Peru legal and regulatory review checklist

## Outcome

Phase 0 has documented the known legal questions; it has **not** resolved them. Public launch remains blocked until written counsel or authority evidence, named accountable parties, and tested procedures exist.

Each row separates a confirmed source from the product inference and the unresolved decision. This is not legal advice or a compliance claim.

## Identity, rectification, and liability

| Confirmed source | Product inference | Required evidence / blocker |
| --- | --- | --- |
| [Law 26847](https://www.leyes.congreso.gob.pe/documentos/Leyes/26847.pdf) and [TC case 02002-2023-AA](https://www.tc.gob.pe/jurisprudencia/2026/02002-2023-AA.html): each edition/emission identifies a director/equivalent and service address; request within 15 calendar days by reliable means; daily-media rectification within seven days; other media next edition; non-written media may request same weekday/time. | Website and audio identify an accountable person and Peru receipt channel; immutable deadline tracking supports a seven-day response capability. | `[LEGAL ENTITY]`, `[RESPONSIBLE EDITOR]`, `[PERU SERVICE ADDRESS]`, reliable receipt channel, and written internet-audio/replay/archive interpretation. |
| [TC case 02982-2010-AA](https://www.tc.gob.pe/jurisprudencia/2011/02982-2010-AA.html): rectification is confined to the inaccurate message and must not be undermined by commentary. | Publish factual correction/rectification without editorial retaliation or silent replacement. | Counsel-approved templates and tested same-channel procedure. |
| [TC case 00983-2023-AA](https://www.tc.gob.pe/jurisprudencia/2026/00983-2023-AA.html): online material may require updating/linking when later information disproves it. | Preserve history internally while prominently linking public archives to later correction or withdrawal. | Counsel-approved archive, erasure, public-interest, and privacy balancing rule. |

## Personal data and security

| Confirmed source | Product inference | Required evidence / blocker |
| --- | --- | --- |
| [Supreme Decree 016-2024-JUS](https://www.gob.pe/institucion/anpd/normas-legales/6554453-16-2024-jus): data-bank inventory/registration, security document, access and traceability controls, backups, rights procedures, and incident duties apply as scoped by the regulation. | Minimize real data and block audience/source/complaint processing until inventory, notice, contracts, filings, security controls, and deletion rules exist. | `[PRIVACY OWNER]`, `[SECURITY OWNER]`, bank inventory/registration evidence, notices, processor agreements, transfer analysis, approved security document, and tested deletion. |
| Article 34: qualifying incidents notify ANPD within 48 hours; affected people within 48 hours when rights are affected; digital incidents also route to the National Digital Security Center. | Run one incident clock with separate notification decisions and immutable evidence. | Tested 48-hour exercise with named primary/backup and counsel-approved templates. |
| Article 69 generally sets 8 days for information, 20 for access, and 10 for rectification/cancellation/opposition. | Dedicated privacy intake must not be confused with media rectification. | Counsel confirms identity verification, calculation, extensions, exceptions, and editorial-archive interaction. |

## Internet distribution and MTC

| Confirmed source | Product inference | Required evidence / blocker |
| --- | --- | --- |
| MTC publishes authorization requirements for radio/television using open-signal broadcast services: [overview](https://www.gob.pe/institucion/mtc/noticias/1174227-mtc-quieres-brindar-servicios-de-radio-o-television-conoce-como-obtener-la-autorizacion) and [procedure](https://www.gob.pe/institucion/mtc/informes-publicaciones/5652877-procedimiento-para-obtener-autorizacion-para-la-prestacion-de-un-servicio-de-radiodifusion-persona-natural). MTC also maintains a [value-added service registry](https://www.gob.pe/22829-registro-para-servicio-de-valor-anadido). | An internet-only player on third-party infrastructure appears distinct from terrestrial spectrum broadcasting, but the official material does not expressly classify this exact service. | Written MTC/counsel classification for broadcast authorization, value-added registration, and effects of 24/7 service, apps, subscriptions, advertising, own CDN, or future FM. Use the [MTC contact channel](https://portal.mtc.gob.pe/comunicaciones/concesiones/contactenos.html). |

## AI governance

| Confirmed source | Product inference | Required evidence / blocker |
| --- | --- | --- |
| [Supreme Decree 115-2025-PCM](https://www.gob.pe/institucion/pcm/normas-legales/7133522-115-2025-): Article 7 addresses privacy, rights, reliability, human supervision, transparency, and accountability; humans must be able to correct, modify, or stop, and actors remain responsible. | Autonomous routine publication still needs named humans with real stop/correct authority, disclosure, limitations, and auditability. | `[ACCOUNTABLE OPERATOR]`, `[KILL-SWITCH PRIMARY/BACKUP]`, access tests, public disclosure, capability limits, audit, and public report channel. |
| Articles 22.2 and 24.1(j) establish acceptable-risk duties and a high-risk catch-all where rights are at risk or supervision is complex; Article 25 adds high-risk duties. Articles 31.2–31.4 address documented private policies, education, and trained human controls; Article 36 references citizen alerts through [IA Peru](https://www.gob.pe/iaperu). | Bounded general news is not expressly named high-risk, but identifiable-person reporting or category expansion may trigger the catch-all. | Written risk classification from counsel/appropriate authority, effective-date and entity-scope analysis, labeling requirements, and reclassification gate before sensitive categories. |

## Consumer and commercial launch

| Confirmed source | Product inference | Required evidence / blocker |
| --- | --- | --- |
| [Indecopi complaint-book guidance](https://www.gob.pe/institucion/indecopi/campa%C3%B1as/65149-libro-de-reclamaciones-todo-lo-que-debe-saber-antes-de-solicitarlo) describes the complaint book and a 15-business-day response period. | Advertising, sponsorship, subscriptions, or paid accounts may create additional consumer duties and require a separate complaint channel. | Counsel confirms applicability and implements the complaint book before any commercial public launch. |

## Source rights review

- Approve each intended act separately: collection, extraction, translation, summarization, quotation, storage, model use, public attribution, redistribution, and revision/tombstone retention.
- Save the exact terms URL, verification date, terms snapshot, and content hash before enabling a connector.
- Confirm third-party exclusions and upstream ownership; an official host does not grant rights to embedded third-party content.
- Treat the current [`source-registry.yaml`](../config/source-registry.yaml) statuses as non-active. Apparent reusable terms are evidence for review, not final permission.

## Launch sign-off

- [ ] Legal entity, responsible editor/operator, and Peru service address assigned.
- [ ] Rectification, correction, withdrawal, privacy, security, and consumer channels operational.
- [ ] Seven-day media-rectification and 48-hour privacy-incident exercises passed.
- [ ] MTC internet-service classification obtained in writing.
- [ ] Data banks inventoried/registered as required; security document approved.
- [ ] AI risk classification and human-supervision model approved.
- [ ] Kill-switch primary and backup successfully tested.
- [ ] Every production source has source-specific rights and technical admission evidence.
- [ ] Commercial model reviewed and complaint book implemented if applicable.

Until every applicable box is checked with a linked artifact, Novaris News is not launch-ready.
