# Bulletin lifecycle policy

## Decision

Novaris News schedules 5–10 minute bulletins at 08:00 and 18:00 `America/Lima`. A published edition may be replayed only until 16 hours after its original publication. After that deadline, the player shows that no current edition is available and serves no audio—never filler or unverified content.

This is an approved product policy, not a claim of legal compliance or production readiness.

## Lifecycle states

| State | Meaning | Playback eligibility |
| --- | --- | --- |
| `scheduled` | Edition window exists; evidence assembly has not completed | No |
| `held` | A required evidence, policy, rights, or infrastructure gate did not pass | No |
| `published` | Immutable script, audio, disclosure, provenance, and audit records passed every gate | Yes, within its own 16-hour window |
| `replaying` | Latest eligible edition is served after a newer edition was held or missed | Yes, with replay disclosure |
| `withdrawn` | A critical error or material-harm decision removed the edition from public playback | No |
| `expired` | Sixteen hours have elapsed since original publication | No |
| `superseded` | A newer valid edition exists | No by default; it may return only as the newest unaffected fallback after a later edition is withdrawn, and only while its own window remains open |

## Playback decision

Eligibility is evaluated **for every playback request**; a playlist or cached URL is not permanent authorization.

```text
if global stop is active: visible unavailable status + no audio
else exclude every withdrawn edition and every edition at or beyond its own 16-hour expiry
choose the newest remaining edition, including an unaffected superseded fallback
if none remains: visible unavailable status + no audio
else if any newer scheduled edition was held, missed, or withdrawn: replay with disclosure
else: play the newest eligible edition
```

The request-time decision must use an authoritative clock, current withdrawal state, current kill-switch state, and the edition's immutable original publication timestamp. CDN caches and signed URLs must not outlive eligibility.

## Replay disclosure

When replaying an older edition, the player and audio must both state:

- the original publication date and time in `America/Lima`; and
- that no newer verified edition is available.

The disclosure must occur before substantive news content in audio and remain visible beside the playback control. The original timestamp never changes when an edition is replayed.

## Failure and replacement rules

- A held or failed scheduled edition does not extend the prior edition's 16-hour window.
- An older unaffected edition may be used only while **its own** 16-hour window remains open.
- A critical factual, legal, privacy, disclosure, provenance, or safety error withdraws the affected edition immediately.
- Withdrawal invalidates current and future playback authorization, including cached artifacts; the public surface shows a withdrawal status and, when safe, a correction link.
- A corrected edition is a new immutable version with its own publication timestamp. It does not rewrite the withdrawn record.
- If no edition is eligible, the service shows a plain unavailable status and serves no audio. It never generates filler to maintain a radio illusion.

## Audit and retention boundary

Public withdrawal does not delete the internal record. Evidence, risk decisions, script versions, audio fingerprints, publication events, replay decisions, withdrawals, and corrections form an immutable audit history with access controls.

This policy does **not** set a legal retention period. Retention remains blocked on the approved privacy/security inventory and legal review; see [Privacy and retention](PRIVACY_AND_RETENTION.md).

## Required tests before public use

- Request one millisecond before and at the 16-hour boundary.
- Hold the 18:00 edition and verify the 08:00 edition expires at 00:00 the next day.
- Withdraw the latest edition and verify fallback uses only an older unaffected, unexpired edition.
- Withdraw all eligible editions and verify a visible unavailable status with no audio response.
- Activate the global kill switch during playback and verify delivery stops within a maximum enforcement latency that is defined and approved before public use.
- Verify audio and visual replay disclosures contain the original timestamp and no-newer-edition statement.
- Verify CDN and direct asset URLs cannot bypass request-time eligibility.

These procedures are specified but remain **untested**.

The maximum active-playback withdrawal and kill-switch enforcement latency remains an implementation and launch-approval blocker; this document does not invent a value.
