# Novaris News

Private synthetic engineering spike for a proposed Spanish audio-news service for Peru and Latin America. It is not production-ready or a reliable news source; Phase 0 launch blockers remain open.

The current workspace validates evidence admission, assembles immutable evidence packages, records deterministic audit lineage (optionally in test PostgreSQL 17), and generates exact-claim Spanish scripts through a deterministic local adapter. It has no real connectors/model calls, audio, scheduler, public API, deployment or publication path; coverage is short of the 24 planned fixture cases.

## Develop

Use Node.js 24 and the pnpm version pinned in package.json. Ensure pnpm is on PATH (for Corepack, run `corepack enable pnpm` once): package scripts invoke pnpm internally.

```sh
nvm use
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm test
corepack pnpm harness
```

The deterministic harness is database-free and exits nonzero on implemented-case expectation failures. For isolated database checks (POSIX shell):

```sh
cp .env.audit.example .env.audit
# Replace every placeholder with local test-only values before continuing.
set -a; source .env.audit; set +a
corepack pnpm audit:db:up
trap 'corepack pnpm audit:db:down' EXIT
corepack pnpm audit:migrate
corepack pnpm test:integration:audit
corepack pnpm harness:audit
```

Never use an existing application/Supabase database: distinct migrator/runtime roles and the dedicated disposable Compose database are required; teardown removes its volume.

## Read by task

| Task | Contract |
| --- | --- |
| Delivery and current gaps | [Implementation gates](docs/IMPLEMENTATION_PLAN.md), [fixtures](docs/PHASE_1_FIXTURES.md) |
| Product and system boundaries | [Requirements](docs/PRODUCT_REQUIREMENTS.md), [architecture](docs/ARCHITECTURE.md) |
| Sources and evidence | [Registry](config/source-registry.yaml), [editorial safety](docs/EDITORIAL_SAFETY.md), [topic rules](docs/TOPIC_EVIDENCE_POLICIES.md) |
| Publication, corrections, shutdown | [Lifecycle](docs/BULLETIN_LIFECYCLE.md), [incidents](docs/CORRECTIONS_AND_INCIDENTS.md) |
| Launch approval and operations | [Phase 0 checklist](docs/PHASE_0_FOUNDATIONS.md#exit-checklist), [legal questions](docs/LEGAL_REVIEW_CHECKLIST.md), [privacy/retention](docs/PRIVACY_AND_RETENTION.md) |

Publication evidence requires admitted official primary sources; admitted independent media may only corroborate. Aggregators/social networks are discovery-only. Unresolved rights, contradictions or insufficient evidence hold/reject the item; a model is never a source. Mandatory disclosure, provenance, corrections and stop controls cannot be replaced with disclaimers. Numerical confidence scores remain deferred until validated.

Next engineering work: persist validated-script lineage, expand fixtures and strengthen semantic controls. Real-source admission, accountable operators, tested procedures and counsel/authority decisions remain mandatory before launch.
