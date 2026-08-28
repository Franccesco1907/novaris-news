# Privacy, security, and retention baseline

## Launch decision

Real audience accounts, analytics identifiers, source-subject profiles, complaint data, or privacy-request data must not enter production until the data inventory, required filings, privacy notice, processor agreements, security document, retention schedule, and incident runbook are approved.

This baseline is derived from Peru's current personal-data regulation, [Supreme Decree 016-2024-JUS](https://www.gob.pe/institucion/anpd/normas-legales/6554453-16-2024-jus). It is product research, not legal advice or a compliance claim.

## Accountable roles

| Responsibility | Owner |
| --- | --- |
| Data controller/legal entity | `[LEGAL ENTITY — UNASSIGNED]` |
| Privacy owner | `[PRIVACY OWNER — UNASSIGNED]` |
| Security owner | `[SECURITY OWNER — UNASSIGNED]` |
| Data-bank registration owner | `[REGISTRATION OWNER — UNASSIGNED]` |
| Processor/vendor owner | `[VENDOR OWNER — UNASSIGNED]` |
| 48-hour incident commander and backup | `[PRIMARY — UNASSIGNED]` / `[BACKUP — UNASSIGNED]` |
| ARCO intake channel | `[PRIVACY CHANNEL — UNASSIGNED]` |

## Required data inventory

Create one row per processing purpose, not one vague row per database.

| Field | Required content |
| --- | --- |
| Category and data subjects | Data elements and whose data they contain |
| Purpose | Specific operational/editorial/audience purpose |
| Legal basis or consent | Counsel-confirmed basis and evidence |
| Source | Direct, public source, vendor, generated, or inferred |
| Storage and location | System, region, encryption, backups |
| Controller and processor | Legal entities and contracts |
| Transfers | Recipient, country, safeguards, and purpose |
| Access roles | Least-privilege role and approval owner |
| Retention trigger | Event that starts the period, not an arbitrary date |
| Deletion/anonymization | Method, backups, verification, exceptions |
| ARCO handling | Searchability, correction, cancellation, opposition |
| Sensitivity and impact | Special categories, identifiable people, harm analysis |

Counsel must determine the lawful basis and privacy/public-interest balance for editorial evidence and archives, the boundaries of each personal-data bank, registrations, and international transfers.

## Confirmed controls

The regulation requires, as applicable:

- data-bank registration and updates under Articles 42–45;
- a current approved security document describing lifecycle policies, systems inventory, and sensitive data under Article 47;
- access, authentication, privilege, training, and traceability controls, including semiannual privilege review and traceability logs kept for at least two years, under Article 46;
- backup and integrity controls under Article 48;
- documented incidents and immediate processor-to-controller notification under Articles 35–36; and
- general avoidance of indefinite retention. A processor's post-engagement retention is capped at two years absent an applicable exception under Article 31.2.

The two-year traceability-log minimum and processor cap are specific regulatory periods. They are **not** blanket retention periods for source evidence, audio, analytics, requests, or other data.

## Provisional minimization defaults

Until counsel approves a schedule:

- collect no account data; provide anonymous playback where feasible;
- disable third-party advertising, personalization, precise location, and cross-site tracking;
- use aggregate operational metrics without persistent listener identifiers where possible;
- store discovery-only source URLs and minimal metadata, not article bodies;
- exclude unnecessary personal data from model prompts, logs, fixtures, and analytics;
- use synthetic data for Phase 1 privacy and complaint tests; and
- retain real data only when a documented purpose, basis, owner, and deletion trigger exist.

These are provisional product controls, not invented legal retention periods.

## Security document template

The approved security document must identify:

1. data inventories and flows, systems, vendors, regions, and transfers;
2. sensitivity classification and risk assessment;
3. authentication, authorization, least privilege, and semiannual review;
4. encryption, key management, secrets, backups, integrity, and recovery;
5. logging, tamper evidence, monitoring, and the applicable retention rule;
6. secure development, dependency, vulnerability, and change controls;
7. processor obligations and immediate incident escalation;
8. deletion, anonymization, backup expiry, and legal holds; and
9. named privacy/security owners, training, exercises, and approval history.

## 48-hour privacy incident procedure

1. **Detect and timestamp:** open an immutable incident record and identify systems, data, subjects, and likely impact.
2. **Contain:** revoke access, isolate connectors or playback, preserve forensic evidence, and avoid destructive cleanup.
3. **Notify internally immediately:** processors notify the controller without delay; page the privacy owner, security commander, legal counsel, and responsible operator.
4. **Assess:** determine confidentiality, availability, and integrity impact; affected people; geography; ongoing risk; and notification recipients.
5. **Notify authorities:** qualifying incidents must be reported to the National Authority for Personal Data Protection within 48 hours under Article 34.1. Digital-security incidents also route to the National Digital Security Center under Articles 34.4–34.5.
6. **Notify affected people:** when their rights are affected, notify them within 48 hours with clear risk and mitigation information.
7. **Document:** preserve facts, decisions, notifications, containment, recovery, and processor communications for every incident, including those not notified externally.
8. **Recover:** restore only after owner approval and verify access, integrity, deletion, and monitoring controls.

## Rights-request timing baseline

Article 69 generally provides 8 days for information, 20 days for access, and 10 days for rectification, cancellation, or opposition. Counsel must confirm calculation, extension, identity verification, exceptions, and interaction with journalistic/editorial records.

## Retention approval table

No row may enter production with `TBD`.

| Data class | Purpose/basis | Trigger | Period | Deletion/anonymization | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Source evidence and revisions | `[COUNSEL REVIEW]` | `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` | Blocked |
| Scripts, audio, and publication audit | Accountability/corrections; basis pending | `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` | Blocked |
| Security traceability logs | Regulatory security control | Log creation | At least 2 years, subject to final scope | Secure deletion after holds | `[SECURITY OWNER]` | Scope review required |
| Audience operational metrics | Service operation; basis pending | Event/aggregation | `[MINIMIZED PERIOD TBD]` | Aggregate/anonymize/delete | `[TBD]` | Blocked |
| Correction/rectification cases | Legal response; basis pending | Case close | `[TBD]` | Restricted deletion/hold process | `[TBD]` | Blocked |
| Processor copy after engagement | Processor transition | Engagement end | No more than 2 years absent exception | Verified return/deletion | `[VENDOR OWNER]` | Contract required |

Public launch remains blocked until every applicable row has a counsel-reviewed period and tested deletion path.
