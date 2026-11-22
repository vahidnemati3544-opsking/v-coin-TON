# V COIN – TON | Global Due Diligence Readiness Register

**Document ID:** VCT-GDD-001  
**Version:** 1.0.2  
**Review date:** 2026-11-18  
**Repository:** vahidnemati3544-opsking/v-coin-TON  
**Branch:** main  
**Scope:** V COIN – TON only. The legacy BNB Smart Chain project is excluded.

> Internal readiness register only. This is not a legal opinion, independent security audit, deployment certificate, or approval to launch.

## 1. Executive status

The repository contains project architecture and tokenomics documents, backend and database components, a mining engine, tests, and CI workflow definitions. Their presence does not establish successful execution, production readiness, security, deployment, or legal approval.

**Current release decision: NO-GO** for public token distribution, real-value payouts, Mainnet launch, public mining activation, exchange/listing claims, or paid token promotion until the applicable gates in section 9 are evidenced.

The mining API's deliberate HTTP 503 response with `WALLET_BALANCE_MINING_NOT_IMPLEMENTED` is a fail-closed safety control. Keep it active until wallet-based mining is implemented and verified.

## 2. Evidence inventory reviewed

Repository paths previously inspected on `main`:

| Path | What it establishes | What it does not establish |
|---|---|---|
| `README.md` | Project overview; development status | Live service or deployed token |
| `docs/TON_ARCHITECTURE.md` | TON architecture and limitations | Mainnet deployment |
| `docs/TOKENOMICS.md` | 2.1B supply design, 6 decimals, proposed allocation | Minted supply, balances, vesting or custody |
| `docs/JETTON_CONTRACT_SPEC.md` | TEP-74/TEP-64 design requirements | Implemented Master/Wallet contracts |
| `docs/JETTON_DEPLOYMENT_INVENTORY.md` | Deployment evidence inventory | A verified deployed Master address |
| `docs/MINING_READINESS_PLAN.md` | Mining readiness decision and work register | Live extraction |
| `docs/WALLET_BALANCE_MINING_SPEC.md` | Wallet-balance mining requirements | Working on-chain balance reader |
| `docs/DATABASE_ARCHITECTURE.md` | Schema and database design | Successful local or production DB operation |
| `docs/SECURITY_ANTI_FRAUD.md` | Security controls and safeguards | Independent security audit |
| `docs/API_ARCHITECTURE.md` | API design | Production availability |
| `BACKEND-ARCHITECTURE.md` | Backend architecture | Operational deployment |
| `DEPLOYMENT_ARCHITECTURE.md` | Deployment plan | Completed deployment |
| `contracts/mining/engine.js` | Mining engine source | Verified wallet-based eligibility |
| `contracts/mining/backend/src/server.js` | Backend server and blocked mining endpoints | Live mining service |
| `contracts/mining/backend/src/config/database.js` | PostgreSQL pool configuration | Successful connection from the user's machine |
| `contracts/mining/backend/database/schema.sql` | Database schema | Applied schema or reconciled ledger |
| `contracts/mining/backend/database/migrations/` | Migration scripts, including reserve, settlement and balance-based mining migrations | Successful ordered migration execution |
| `contracts/mining/backend/test/` | Test files | Passing, non-skipped integration tests |
| `.github/workflows/backend-ci.yml` | Backend CI workflow definition | Passing CI run |
| `.github/workflows/ton-mining-ci.yml` | Mining CI workflow definition | Passing CI run |

This is a repository evidence inventory, not a complete source-code review. Recheck live paths and commit hashes before relying on it externally.

## 3. Corrected capability statements

1. **Jetton:** the specification is documented; implementation, reproducible build, deployment and verified Master address are not established by the reviewed evidence.
2. **Mining:** the engine exists but internal database balances are not equivalent to verified TON wallet balances.
3. **API:** mining is deliberately blocked with HTTP 503. Do not remove the block to make a demo appear operational.
4. **PostgreSQL:** schema, migrations and connection configuration exist. A Running Windows service does not prove this application connected or migrations ran.
5. **Wallet and Telegram:** code/documentation presence does not prove end-to-end wallet ownership proof, trusted Jetton balance retrieval, or a live Telegram Mini App.
6. **Tokenomics:** allocations are design assumptions, not proof of minted, locked, vested or wallet-held tokens.
7. **Assurance:** no independent smart-contract audit, backend penetration test, jurisdiction-specific legal opinion or exchange approval has been established here.

## 4. Remediation register

| No. | Area | Required action / evidence | Status |
|---:|---|---|---|
| 1 | Jetton contracts | Implement Master and Wallet contracts against `docs/JETTON_CONTRACT_SPEC.md`; add reproducible build and tests | BLOCKED |
| 2 | Deployment inventory | Keep deployed Master and Jetton Wallet addresses marked UNVERIFIED until Founder-approved TON Mainnet deployment and authoritative on-chain verification | UNVERIFIED |
| 3 | Wallet ownership | Implement signed wallet proof, expiry, nonce and replay protection | NOT VERIFIED |
| 4 | Jetton balance reader | Validate network, exact Master, owner address, balance and data freshness | NOT IMPLEMENTED / NOT VERIFIED |
| 5 | Mining eligibility | Calculate only from verified wallet snapshots; do not trust client-supplied balances | BLOCKED |
| 6 | Mining API | Keep HTTP 503 until end-to-end wallet mining passes release tests | SAFETY BLOCK ACTIVE |
| 7 | Payout lifecycle | Add approval, idempotency, bounce/finality handling and ledger reconciliation | NOT VERIFIED |
| 8 | PostgreSQL | Back up an isolated development DB, run ordered migrations and record versions/checksums | LOCAL VERIFICATION PENDING |
| 9 | Database tests | Run non-skipped integration tests for concurrency, rollback, reserve exhaustion and settlement | NOT VERIFIED |
| 10 | Level schedule | Approve exact level rules, costs and seed data before implementation; do not invent rates | OWNER DECISION REQUIRED |
| 11 | Referrals | Approve formula, qualifying activity, eligibility, caps, abuse controls and reserve accounting | DESIGN / UNVERIFIED |
| 12 | Telegram | Verify bot ownership, webhook security and end-to-end test account flow | NOT VERIFIED |
| 13 | Security | Obtain independent contract audit and backend penetration test; remediate critical/high findings | NOT STARTED |
| 14 | Treasury | Approve custody, key roles, transaction authorisation, recovery and reconciliation | POLICY / EVIDENCE PENDING |
| 15 | Legal | Identify responsible entity and obtain written market-specific legal opinions | NOT STARTED |
| 16 | Communications | Map each public claim to evidence; label roadmap features as planned | CONTROL REQUIRED |

## 5. Tokenomics arithmetic check

The current owner-approved design totals 2,100,000,000 VCOIN:

| Allocation | Share | Planned VCOIN |
|---|---:|---:|
| Founder | 20% | 420,000,000 |
| Mining rewards | 50% | 1,050,000,000 |
| Treasury | 10% | 210,000,000 |
| Liquidity / market | 10% | 210,000,000 |
| Ecosystem / marketing | 10% | 210,000,000 |
| **Total** | **100%** | **2,100,000,000** |

At six decimals, the planned total is 2,100,000,000,000,000 base units. This is arithmetic for the design only, not proof of on-chain issuance.

The Founder allocation is 420,000,000 VCOIN, payable in one immediate allocation with no vesting or time lock. Continue to define and verify mining reserve custody and payout model; treasury wallet controls; liquidity release controls; ecosystem budget controls; and a reconciliation method preventing double-counting.

The proposed referral terms (100 VCOIN per qualifying invitation and 2% of referred-user activity while active) remain unapproved for implementation until the activity definition, eligibility, caps, anti-abuse rules, accounting and legal review are complete.

## 6. Correct database path and safe local procedure

Authoritative paths:
- Schema: `contracts/mining/backend/database/schema.sql`
- Migrations: `contracts/mining/backend/database/migrations/`
- Backend configuration: `contracts/mining/backend/src/config/database.js`

Do not create a duplicate root-level database schema. The documented development setup command is run from `contracts/mining/backend` using `npm run db:setup`; it is not a production migration procedure.

Before running it on the user's computer:
1. Confirm target database and role.
2. Back up the target database.
3. Use a dedicated development/test database.
4. Keep credentials in an untracked local `.env`.
5. Run only against the intended non-production database.
6. Record migration versions and test output.
7. Never share passwords, connection strings, bot tokens or private keys in chat or GitHub.

## 7. Public claim controls

**Permitted with development status visible:**
- “V COIN – TON is under development.”
- “The project has a documented TON Jetton design.”
- “The repository contains backend, PostgreSQL and mining components under development.”
- “Wallet-based mining and Mainnet deployment remain subject to implementation, testing and review.”

**Not permitted without new evidence:**
- “VCOIN is deployed on TON.”
- “Mining is live” or “users can withdraw mined VCOIN.”
- “The contract is audited” or “fully secure.”
- “The project is licensed or approved” in a country.
- “VCOIN is listed, liquid or accepted by exchanges.”
- Any guaranteed price, profit, liquidity, adoption, or misleading comparison with Bitcoin or another asset.

## 8. Accountability and confidential founder identity

A public pseudonym may be used only where lawful. It must not conceal the legally responsible entity, beneficial ownership, controlling persons, source of funds or disclosures required by regulators, banks, auditors and counterparties.

Keep separate records for public display identity, legal identity/beneficial ownership, responsible entity, token allocation ownership, wallet custody, transaction approval authority and operational access. Store sensitive identity records only through an approved secure legal process. Never upload seed phrases, private keys, passwords, signing keys or raw credentials.

## 9. Release gates — all applicable items must pass

- [ ] Jetton Master and Wallet contracts implemented, reviewed and tested.
- [ ] Founder-approved Mainnet deployment transaction and Master address independently verified.
- [ ] Supply, decimals, admin and mint-disable behaviour verified from contract state and transaction history.
- [ ] Wallet ownership proof tested against replay and expiry attacks.
- [ ] Balance reader validates exact network, Master, owner and freshness.
- [ ] Mining uses verified wallet snapshots, not client-supplied or unverified internal balances.
- [ ] Reserve, ledger and payout accounting reconcile without double-counting.
- [ ] Bounce, finality, concurrency and idempotency tests pass.
- [ ] PostgreSQL migrations and non-skipped integration tests pass on an isolated DB.
- [ ] Independent security reviews completed; critical/high findings resolved.
- [ ] Treasury controls and incident response approved.
- [ ] Responsible entity and jurisdiction-specific legal requirements confirmed by qualified counsel.
- [ ] Public statements and campaigns approved for the exact audience and jurisdiction.

## 10. Immediate no-go conditions

Do not activate public mining, real-value payouts, Mainnet or a public token offer while any applicable critical requirement remains unresolved. In particular, no launch while the Jetton implementation is unverified, wallet-based mining is blocked, accounting is unreconciled, critical security findings remain, treasury controls are undefined, or required legal permissions are missing.

## 11. Change log

| Version | Date | Change |
|---|---|---|
| 1.0.1 | 2026-11-18 | Corrected file path and scope; added evidence-based capability matrix, remediation register, DB safety procedure and release gates |\n| 1.0.2 | 2026-11-18 | Recorded pre-PostgreSQL safeguards: local-host-only setup, backend secret ignores, repeatable integration-test migration handling, and clarified legacy mining migration status |

## 12. Pre-PostgreSQL corrections committed\n\nThe following safeguards were committed to the TON repository and re-read from GitHub:\n\n| File | Correction | Evidence status |\n|---|---|---|\n| `contracts/mining/backend/.gitignore` | Ignore local `.env` files, dependencies, logs and generated coverage while retaining `.env.example` | COMMITTED / READ-BACK VERIFIED |\n| `contracts/mining/backend/scripts/setup-database.js` | Refuse non-local database hosts and production mode; preserve migration checksum protection | COMMITTED / READ-BACK VERIFIED |\n| `contracts/mining/backend/test/mining-ledger.integration.test.js` | Centralize test migration setup and safely reset the legacy migration's named CHECK constraint before replay on the isolated test database | COMMITTED / READ-BACK VERIFIED; CI RUN PENDING |\n| `contracts/mining/backend/README.md` | Document local-only setup, secret handling, and the distinction between legacy internal-balance mining and wallet-based extraction | COMMITTED / READ-BACK VERIFIED |\n| `docs/DATABASE_ARCHITECTURE.md` | Correct migration 003 description, migration order, and database safety/test guidance | COMMITTED / READ-BACK VERIFIED |\n\n**Important limitation:** the integration tests still exercise the legacy internal-balance engine. They do not verify TON wallet ownership, Jetton balance reading or on-chain payouts. The public mining API remains intentionally blocked. GitHub Actions was triggered by these commits but had not completed when this register was updated.\n\n**Final status:** safeguards committed and verified by reading the files back from GitHub. Runtime PostgreSQL tests, local connection, audit, deployment and regulatory approval remain unverified.
