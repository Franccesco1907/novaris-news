# Corrections, rectification, withdrawal, and incident runbook

## Readiness status

This runbook is specified but **not operationally tested**. The legal entity, responsible editor/operator, Peru service address, channel owners, and kill-switch operators are unassigned. Those gaps block public launch.

This is product research and an operational baseline, not legal advice or a declaration of compliance.

## Accountable roles

| Role | Named owner | Required authority |
| --- | --- | --- |
| Legal entity/publisher | `[LEGAL ENTITY — UNASSIGNED]` | Accept legal responsibility and fund remediation |
| Director or responsible editor/equivalent | `[RESPONSIBLE EDITOR — UNASSIGNED]` | Decide corrections and legal rectifications |
| Peru service address | `[PERU SERVICE ADDRESS — UNASSIGNED]` | Receive reliable rectification notices |
| Correction intake owner | `[CORRECTION OWNER — UNASSIGNED]` | Timestamp, acknowledge, classify, and route requests |
| Privacy owner | `[PRIVACY OWNER — UNASSIGNED]` | Route data-subject and privacy incidents |
| Security incident commander | `[SECURITY OWNER — UNASSIGNED]` | Contain and document security incidents |
| Kill-switch primary/backup | `[PRIMARY — UNASSIGNED]` / `[BACKUP — UNASSIGNED]` | Stop publication and playback without preapproval |
| Legal escalation | `[PERU COUNSEL — UNASSIGNED]` | Interpret deadlines, channel, and remedy |

Every public edition/emission must identify the responsible director or equivalent and the address where it is edited/emitted or receives rectification requests, subject to counsel's internet-audio interpretation.

## Separate intake channels

Do not collapse these into one untraceable inbox:

| Channel | Placeholder | Purpose |
| --- | --- | --- |
| Rectification | `[RECTIFICATION CHANNEL]` | Requests under Peru's rectification framework |
| Editorial correction | `[CORRECTION CHANNEL]` | Factual updates, source corrections, and withdrawal reports |
| Privacy/ARCO | `[PRIVACY CHANNEL]` | Information, access, rectification, cancellation, and opposition requests |
| Security | `[SECURITY CHANNEL]` | Confidential vulnerability and incident reporting |
| Consumer complaints | `[CONSUMER CHANNEL / COMPLAINT BOOK]` | Commercial-service complaints, if applicable |

Each channel must create an immutable receipt time, case ID, provided content hash, contact method, classification, owner, deadline, actions, and evidence of response.

## Confirmed legal timing baseline

Under [Law 26847](https://www.leyes.congreso.gob.pe/documentos/Leyes/26847.pdf), a rectification request is made within 15 calendar days by notarial or other reliable means. Daily media rectify within seven days; other media do so in the next edition. For non-written media, the requester may seek the same weekday and time. Rectification is free, immediate, proportional, and confined to disputed facts. The Constitutional Court has reaffirmed the framework in [case 02002-2023-AA](https://www.tc.gob.pe/jurisprudencia/2026/02002-2023-AA.html).

Counsel must determine the exact trigger, format, and deadline for scheduled internet audio, replay, archives, and any foreign entity. Operationally, Novaris News must be capable of publishing within seven days; this conservative capability does not replace counsel's interpretation.

If a commercial launch makes Peru's complaint-book rules applicable, the official [Indecopi guidance](https://www.gob.pe/institucion/indecopi/campa%C3%B1as/65149-libro-de-reclamaciones-todo-lo-que-debe-saber-antes-de-solicitarlo) states a 15-business-day response period. Consumer complaints remain distinct from legal rectification and privacy rights.

## Severity and action

| Severity | Example | Immediate action | Public action |
| --- | --- | --- | --- |
| `S0 update` | Later figure or scheduled revision without an earlier material error | Revalidate affected claims | Link a timestamped update; preserve earlier version |
| `S1 minor correction` | Non-material wording, label, or attribution error | Prevent reuse; create corrected version | Visible correction note when audience understanding could change |
| `S2 material correction` | Wrong material fact, misleading context, or omitted contradiction | Hold cluster and future bulletins; assess reach | Same-channel correction and corrected edition; notify affected surfaces |
| `S3 critical incident` | Defamation/privacy risk, false emergency instruction, fabricated source/quote, missing AI disclosure, provenance failure | Activate affected-scope or global kill switch; withdraw immediately | Withdrawal notice and correction when safe; legal/privacy/security escalation |

A credible critical report triggers `hold` before full adjudication. It never triggers destructive deletion of evidence or audit history.

## Testable runbook

1. **Receive:** create case ID; record immutable receipt time, channel, requester-provided material, and content hash.
2. **Preserve:** freeze the public version, evidence package, source revisions, script/audio fingerprints, policy versions, playback reach, and audit events.
3. **Classify:** choose `editorial_update`, `editorial_correction`, `legal_rectification`, `privacy_ARCO`, `security_incident`, or `consumer_complaint`; cross-link cases when multiple duties apply.
4. **Contain:** for possible `S3`, hold the story/topic and withdraw or stop playback immediately. Do not wait for a complete investigation.
5. **Assign:** route to the named owner and legal/privacy/security escalation; calculate each applicable deadline independently.
6. **Investigate:** compare retained claims with authoritative source revisions and common origins; document what is confirmed, inferred, or unresolved.
7. **Decide:** record correction text, withdrawal scope, same-channel reach, and whether a later bulletin must carry the correction.
8. **Publish:** create a new immutable version; never silently replace. A rectification must not be undermined by adjacent commentary, consistent with [case 02982-2010-AA](https://www.tc.gob.pe/jurisprudencia/2011/02982-2010-AA.html).
9. **Propagate:** invalidate playback eligibility and caches, update transcript/provenance pages, and link archived material to later disproving information where appropriate; see [case 00983-2023-AA](https://www.tc.gob.pe/jurisprudencia/2026/00983-2023-AA.html).
10. **Verify and close:** independently test public surfaces, evidence/audit preservation, deadlines, notification delivery, and recovery criteria. Record approval to resume.

## Recovery controls

- Resume only after the failure cause is understood, affected artifacts are isolated, and the responsible operator records a recovery decision.
- A withdrawn edition never becomes playable again by changing a flag; any corrected content is a new version.
- Audit events are append-only. Redaction from operator views may protect personal data, but the authorized internal record and reason remain traceable under the final legal retention schedule.
- A spike in corrections, withdrawals, source revisions, or unsupported claims automatically pauses the affected source/topic pending investigation.

## Test scenarios still required

- Notarial/reliable rectification intake and seven-day deadline tracking.
- Same-weekday/time audio rectification scheduling.
- Critical withdrawal during active playback and cached-asset invalidation.
- Correction propagated to audio, transcript, source page, feed, and archive.
- Separation and cross-linking of rectification, privacy, security, and consumer cases.
- Primary and backup kill-switch operation, authentication, and recovery approval.

No procedure is considered operational until named owners execute and evidence these tests.
