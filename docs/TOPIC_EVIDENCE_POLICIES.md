# MVP topic evidence policies

## Current outcome

These deterministic thresholds define what Phase 1 must test. They do not make publication possible today: every registry connector is non-active pending technical and legal review. Therefore, **all real stories currently fail closed**.

The policies preserve the approved exclusions: unconfirmed crime, medical advice, election polling, emergency alerts, and live conflict casualty figures remain disabled. No output may contain personalized or general financial recommendations.

## Shared rules

An item can be `eligible` only when every material claim:

1. maps to an admitted `E1` source acting within its remit;
2. uses a currently approved product/revision and retains retrieval, publication, and event times;
3. has no unresolved material contradiction;
4. survives common-origin grouping—copies derived from one statement, dataset, wire, owner, or upstream provider count once;
5. is restated without unsupported causal, predictive, comparative, or certainty language; and
6. can expose source links, attribution, and AI disclosure.

`hold` means the evidence may become sufficient inside the applicable source-product window. `reject` means the item cannot satisfy policy for the current edition. `stop` prevents the affected topic or service from publishing because a critical gate, provenance store, rights record, or policy service is unavailable.

## Initial category thresholds

| Category | Minimum evidence after connectors are admitted | Freshness and revision rule | Deterministic outcome |
| --- | --- | --- | --- |
| General economics | One authoritative `E1` statistical product for the exact value, unit, period, vintage, and methodology. Comparative or interpretive claims require each compared value from an admitted authority and may not imply causation. | Use the source's release calendar and revision/vintage marker; a later revision invalidates the earlier claim for new publication. No single hour limit applies to historical indicators. | Exact released facts may become `eligible`; recommendation, forecast, causal inference, or missing vintage is `reject`; unresolved revision is `hold`. |
| Technology and science | One `E1` authority for its own mission, decision, operational status, or authored finding. A claim about external research requires the original paper or responsible primary institution as an admitted source. | Use the source document version and publication/update time. Mission-status claims must use the latest source update before generation. | NASA-remit facts may become `eligible`; external research without an admitted primary source is `hold` then `reject`; unsupported significance or certainty is `reject`. |
| Climate and environment | One in-remit `E1` product for the exact observation or advisory, including geography, validity, and revision. Derived upstream measurements keep the upstream independence group. | Freshness follows the product's `issued`, `effective`, `expires`, `updated`, or revision fields. An expired advisory cannot support a current-condition claim. | In-remit observations may become `eligible`; current claims outside the product window are `reject`; missing validity or unresolved revision is `hold`. Emergency instructions remain excluded. |
| Peru, Latin America, and world current affairs | An admitted official primary record for each material fact plus one independently originated admitted corroborator when the claim is not merely the authority's own action or published record. | Use the issuing record's latest revision and the event-specific evidence window. A generic age threshold is insufficient. | **Blocked:** the initial registry has no admitted broad current-affairs corroborator. Authority self-descriptions may be tested privately, but no current-affairs segment is publishable. |
| Major public-interest events | The topic-specific authority for the exact event fact. Cross-domain claims must satisfy every relevant topic policy. One event must not be promoted into emergency guidance. | Preserve event ID, status, update time, tombstones, and upstream origin. A superseded or deleted event record is not current evidence. | Earthquake parameters may be tested from USGS after admission; casualty, emergency, crime, health, election, and conflict outputs remain excluded. Missing update/tombstone handling is `stop`. |

## Source-specific constraints

- BCRPData series independence derives from the declared series source, not the API host.
- World Bank WDI indicators derived from the same source organization are not independent corroboration.
- GDACS may derive event measurements from USGS or another provider; it cannot corroborate that provider's same fact.
- Multiple SENAMHI pages for one product/upstream source count once.
- NASA news can establish what NASA reported or did, not validate an external paper that it cites.
- NOAA/NWS is not authoritative for Peru and emergency-alert publication remains excluded.

## Generation constraints

- The generator receives only the eligible claim set and its evidence boundaries.
- Any material sentence without a valid evidence link rejects the entire script version.
- Discovery-only text must never enter the generation context, including as background.
- A topic classification of unknown or multiple unresolved policies produces `hold`.
- Market values may be reported as historical facts only when an admitted source and policy exist; advice, rankings, calls to buy/sell/hold, and personalized implications are prohibited.

## Admission gate

Before any real-source Phase 1 run, the relevant entries in [`config/source-registry.yaml`](../config/source-registry.yaml) require endpoint tests, terms snapshots with hashes, rights and attribution review, revision/tombstone tests, and explicit status promotion. No current entry has passed that gate.
