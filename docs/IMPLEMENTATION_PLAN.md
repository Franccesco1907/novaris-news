# Novaris News implementation plan

## Plan outcome

Novaris News will prove that it can publish short, Spanish-language audio bulletins with claim-level evidence traceability before it attempts continuous programming. The product will serve Peru and Latin America while covering major worldwide events relevant to that audience.

The differentiator is not synthetic narration. It is a defensible evidence chain for every material claim. When the system cannot support a claim safely, it remains silent rather than improvising.

> [!IMPORTANT]
> The model is never a source. It may transform an approved evidence package into a script, but it may not introduce facts from its training data, web browsing, or unsupported context.

## Delivery sequence

| Phase | Target duration | Outcome | Public output |
| --- | ---: | --- | --- |
| [0 — Foundations](PHASE_0_FOUNDATIONS.md) | 2–3 days | Resolve the launch rules, accountable operator, source rights model, cadence, categories, and stop conditions | None |
| 1 — Evidence-pipeline spike | 1 week | Produce evidence packages and grounded scripts from approved inputs | None |
| 2 — Reproducible bulletin | 1 week | Generate a versioned bulletin with audio, transcript, sources, disclosure, and lineage | Private prototype |
| 3 — Shadow operation | 2 weeks | Measure the system on two private bulletins per day and audit at least 500 claims | None |
| 4 — Public beta | 2–4 weeks | Publish a constrained general-news service after all launch gates pass | 2 editions/day |
| 5 — Continuous operation | Gate-driven | Increase cadence safely, then add audience choice and richer formats | Every 30–60 minutes |

Durations are planning estimates, not deadlines. A phase advances only when its exit gate passes.

## Phase 0 — Foundations

**Status:** documented, not complete and not launch-ready.

**Objective:** turn product intent into explicit operating constraints before selecting an implementation stack.

Work includes:

- confirm the launch market, jurisdiction, language, and coverage horizon;
- record the confirmed bulletin cadence, duration, time zone, permitted categories, and initial exclusions;
- define the source registry, rights evidence, allowed uses, and attribution requirements;
- define deterministic rules for high-risk topics;
- identify the responsible publisher, responsible editor/operator, rectification address, and kill-switch authority;
- define privacy, correction, incident, retention, and audit requirements;
- obtain Peruvian legal review for the counsel-required questions in the [Phase 0 foundations](PHASE_0_FOUNDATIONS.md).

**Exit gate:** every Phase 0 checklist item is resolved or explicitly blocks launch. A machine-readable candidate registry and private fixture plan exist, but connector verification, named accountable identities, procedure tests, counsel answers, and launch sign-off remain open. No real source may enter a prototype as evidence until its registry status is explicitly admitted.

## Phase 1 — Evidence-pipeline spike

**Objective:** prove the informational core without audio, a public site, or continuous scheduling.

```text
Approved and discovery sources
  -> normalize
  -> deduplicate and cluster
  -> extract atomic claims
  -> corroborate and assess independence
  -> assemble evidence package
  -> generate grounded script
  -> validate every material claim
```

Requirements:

- discovery inputs and publication evidence must be separate concepts;
- [GDELT](https://www.gdeltproject.org/) may help discover events, but a GDELT record is not sufficient publication evidence by itself;
- syndication copies and reports derived from one upstream origin count as one independence group;
- each material script claim must map to retained evidence;
- unresolved contradiction, missing provenance, unknown rights, or failed policy evaluation must produce `hold` or `reject`, never best-effort prose;
- inputs, policies, prompts, model versions, outputs, and decisions must be reproducible and auditable.

**Exit gate:** the spike reliably creates an evidence package and a grounded script from test fixtures, rejects unsupported material claims, and preserves sentence-to-evidence lineage.

## Phase 2 — Reproducible bulletin

**Objective:** turn an approved script into a complete private bulletin artifact.

The bulletin must include:

- text-to-speech narration and a downloadable or streamable MP3;
- an accessible web player and full transcript;
- direct source links and distinct event, source, retrieval, and publication times;
- visible and audible disclosure that the script and/or voice are AI-generated;
- immutable script and audio versions;
- model, prompt, policy, source, and pipeline-version lineage;
- an update and correction relationship that does not silently rewrite history.

**Exit gate:** an operator can reproduce a bulletin version and reconstruct why every material claim was admitted, rejected, or changed.

## Phase 3 — Private shadow operation

**Objective:** measure real operating behavior without publishing to the public.

Run two private bulletins per day for two weeks. Review post-generation samples to evaluate the automation; this audit is not a routine prepublication approval gate.

Measure at minimum:

- claim-level source traceability;
- fabricated or nonexistent sources;
- critical errors in names, dates, numbers, attribution, or material meaning;
- unsupported-claim rate;
- source diversity and independence concentration;
- duplicate-story rate;
- generation and end-to-end latency;
- cost per bulletin and per published minute;
- rejection, correction, and automated-stop causes.

**Public-beta gates:** audit at least 500 material claims, achieve 100% retained source traceability, find zero fabricated sources, and find zero critical errors in the launch evaluation set. Any failure resets the affected evaluation after the root cause and control are corrected; it must not be waived by a disclaimer.

## Phase 4 — Public beta

**Objective:** validate audience value under deliberately narrow operating conditions.

Launch constraints:

- Spanish only;
- one general-news channel for Peru and Latin America;
- major worldwide events selected for relevance to that audience;
- two or three scheduled editions per day;
- visible sources, transcripts, disclosure, reporting, and correction history;
- an identified responsible operator and functioning kill switch;
- no fully autonomous breaking-news alerts at launch;
- no public numerical confidence score.

**Exit gate:** quality, correction, incident, latency, cost, and audience-retention thresholds are met over an agreed observation window, with no unresolved critical incident.

## Phase 5 — Continuous operation and expansion

**Objective:** approach a continuous service without forcing generation to fill airtime.

After the beta gates pass:

1. Generate a new edition every 30–60 minutes when enough safe, material change exists.
2. Replay the last valid edition when no safe update exists; label its original publication time.
3. Add urgent updates only after deterministic high-risk rules have been validated.
4. Add topic channels, configurable presentation tone, and a second language without weakening evidence rules.
5. Evaluate calibrated confidence communication, video presenters, and television distribution as separate product and compliance work.

A 24/7 player does not require continuous generation. Scheduling and replay must never pressure the model to invent filler.

## Product references

These products help frame the market, but public pages often describe intended capabilities rather than independently verified operating behavior. Their claims should be treated as product signals, not evidence that a particular safety or autonomy model works in production.

| Product | Relevant signal | How Novaris differs |
| --- | --- | --- |
| [AI Global News Radio](https://www.aiglobalnewsradio.com/about.html) | Markets a continuously generated AI news-radio experience | Novaris makes claim-level evidence lineage and fail-closed behavior core acceptance criteria |
| [Futuri AudioAI](https://futurimedia.com/products/audio-ai/) | Offers AI-assisted audio and broadcast programming capabilities | Novaris begins as a news product with its own evidence and correction pipeline |
| [NewsGPT](https://newsgpt.ai/24-7-ai-news/) | Markets 24/7 AI-generated news | Novaris delays continuous output until measured evidence gates pass |
| [TIME AI Audio Brief](https://time.com/7294142/time-ai-audio-brief/) | Demonstrates audio generated from a bounded publisher corpus | Novaris uses a multi-source registry while preserving explicit source boundaries |
| [Yahoo Daily Digest](https://www.yahooinc.com/press/yahoo-news-launches-personalized-ai-powered-audio-feature-your-daily-digest) | Demonstrates demand for concise, personalized audio summaries | Personalization is deferred until the general bulletin is safe and useful |
| [Newzopia](https://www.newzopia.com/) | Presents recent news as a short audio queue | Novaris prioritizes versioned evidence and public corrections over feed volume |
| [Channel 1](https://www.channel1.ai/) | Explores AI-native presentation and video news | Video is deliberately outside the Novaris MVP |

## Cross-phase rules

1. Publication remains autonomous, but automated gates, post-generation audit, an accountable human operator, and a kill switch are mandatory.
2. A disclaimer never substitutes for factual, legal, privacy, rights, or safety controls.
3. The source registry is an allowlist for use, not a guarantee that each source statement is true.
4. High-risk controls must be deterministic and versioned; prompt wording alone is not an enforcement mechanism.
5. Every public artifact must retain disclosure, provenance, and correction relationships.
6. Numerical confidence scores remain private until they are calibrated, validated, and shown to be understandable.

## Immediate next step

Use the [Phase 1 synthetic fixtures](PHASE_1_FIXTURES.md) to begin private evidence-pipeline engineering while Phase 0 blockers are resolved. In parallel, test and legally admit selected connectors, assign accountable roles, exercise the correction/privacy/kill-switch procedures, and obtain counsel/authority decisions before any public or real-source launch.
