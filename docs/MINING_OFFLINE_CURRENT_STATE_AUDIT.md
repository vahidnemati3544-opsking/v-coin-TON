# V COIN–TON — Mining Engine and Offline Capability Audit
**Action:** #49  
**Audit date:** 2026-11-22  
**Repository:** vahidnemati3544-opsking/v-coin-TON, branch main  
**Audited HEAD:** fc1c2e317cc7236dd7b26b8c9061b73a7c319a9f  
**Scope:** Existing mining engine, public API gating, Telegram authentication, PostgreSQL schema/migrations, CI configuration, and the locally available ZIP artifact. Read-only audit; no runtime mining or blockchain transactions were performed.

## Executive decision

**Offline mining is NOT implemented. Public mining remains correctly disabled.** The current backend contains a legacy internal-PostgreSQL-balance mining engine, but the public API intentionally returns HTTP 503 until verified TON Jetton wallet-balance mining and confirmed payouts are implemented. The repository has no installable mining PWA, service worker, offline client queue, offline lease protocol, or offline reconciliation endpoint in the audited tree.

The available ZIP is a Jetton contract build artifact, not a complete application/backend release. It cannot be used to deploy or troubleshoot the mining backend by itself.

## 1. Repository evidence

The recursive repository tree contained 112 entries. It includes contracts/mining/engine.js, contracts/mining/backend/**, backend CI, and mining documentation. It does not contain a PWA/web-client application tree, service-worker script, web manifest, IndexedDB client queue, native Android application, or offline synchronization client.

Key source files and audited blob SHAs:
- contracts/mining/engine.js — ab6ff94e184211bd91ed8daa0168d17169c183b5
- contracts/mining/backend/src/routes/mining.js — 125023d68afc8f8efb35e0384c9fb99bbba3c2b7
- contracts/mining/backend/src/server.js — 31092a55e269b9268fb3697088ff7f04459cb7bd
- contracts/mining/backend/src/auth/telegram.js — b2cd053e74bbdbde964ff96d55c6dd8b82729602
- contracts/mining/backend/database/schema.sql — e2629a7a58a667fbd72a5058645f23d59952b5e8
- contracts/mining/backend/database/migrations/001-mining-reserve.sql — 15bf8752d34f6639725eee3a6ef00da749b757cd
- contracts/mining/backend/database/migrations/002-mining-ledger-settlement.sql — 65ba50a76ee9ef0d5451e9274437ce39f325df7b
- contracts/mining/backend/database/migrations/003-balance-based-mining.sql — 6e7506471aded5e4d18d76025c42f4960052163d
- contracts/mining/backend/test/mining-engine.test.js — 394d93a0faa6a7df1581aeebca67df26767e3db6
- contracts/mining/backend/test/mining-ledger.integration.test.js — b0793026576618dc14fbd1be4b56b1992dac54ae
- .github/workflows/backend-ci.yml — fa8b49b53c89dd87b8426f2f5124b2004d230ab8

## 2. Mining engine findings

contracts/mining/engine.js:
- Reads eligible amounts from PostgreSQL balances.available_base_units.
- Starts sessions with a snapshot of that internal balance.
- Calculates 1% per 24 hours using integer base units.
- Uses PostgreSQL server time and a default maximum claim interval of 24 hours.
- Uses transactions, user/session row locks, idempotency keys, reserve reservation, and internal double-entry ledger settlement.
- The engine does not read a verified TON Jetton wallet balance, establish wallet ownership, issue Jettons on-chain, or reconcile on-chain payouts.
- This engine is not compliant with the approved wallet-balance source-of-truth policy and must not be exposed publicly as an extraction route.

## 3. Public API and authentication findings

contracts/mining/backend/src/server.js:
- Applies Helmet, CORS allow-listing, JSON body size limit, and rate limits.
- Telegram authentication routes are mounted.
- All /api/v1/mining requests are deliberately answered with HTTP 503 and WALLET_BALANCE_MINING_NOT_IMPLEMENTED.
- The internal-balance mining router is intentionally not mounted publicly. This fail-closed gate must remain in place.

contracts/mining/backend/src/auth/telegram.js:
- Verifies Telegram Mini App init data using HMAC and checks auth_date.
- Issues random bearer session tokens and stores their SHA-256 hashes.
- This is an online authentication flow. Telegram authentication cannot be completed during a full internet outage; offline continuation must use a previously authenticated local session and a server-issued, bounded offline lease.
- Existing auth tests cover valid HMAC, tampering, expiry, duplicate parameters, missing bot configuration, and one-way session-token hashing. They do not test offline lease issuance, expiry, revocation, or device binding.

## 4. Database and ledger findings

schema.sql already includes users, sessions, wallets, wallet verifications, levels, mining sessions/rewards, referrals, ledger accounts/transactions/entries, balances, blockchain transaction/event records, system events, and audit logs.

Migrations 001 and 002 provide a capped mining reserve and internal double-entry reward settlement. Migration 003 freezes an internal PostgreSQL balance snapshot for each interval. These structures are not an offline queue or verified Jetton wallet snapshot system.

Missing offline-specific persistence:
- signed offline leases and key IDs;
- per-device public-key registration/binding and revocation;
- unique offline event IDs and per-lease sequence constraints;
- sync batch/idempotency records;
- reconciliation outcomes and reason codes;
- explicit provisional-vs-confirmed local/server state;
- support correlation IDs and privacy-minimized diagnostic events.

No offline schema migration was applied during this audit.

## 5. Test and CI findings

contracts/mining/backend/test/mining-engine.test.js tests arithmetic, negative inputs, and invariant rates across levels 1–400.

mining-ledger.integration.test.js has PostgreSQL integration tests guarded by TEST_DATABASE_URL. The backend CI workflow provisions PostgreSQL 18 and sets TEST_DATABASE_URL, then runs syntax checks, database setup twice, and unit/integration tests. The presence of this workflow is not proof that a particular latest run passed; a successful run must be verified separately.

Existing tests do not exercise offline persistence, service-worker behavior, local clock manipulation, duplicate offline event replay, lease expiry, or offline-to-server reconciliation.

## 6. ZIP artifact audit

Locally available artifact:
- Path: /mnt/data/files/VCOIN-TON-MAIN-8b9e8cc-release.zip
- SHA-256: 761124ccd42a8de4085113ac5fe8f21ae6a68c2d82c19cffbd5180cd202db5e1
- Entries: 32
- Deployment preview source commit: 8b9e8cce4461b665040b2f755cec9b2552d13f81
- Preview status: unsigned_mainnet_deployment_preview_only

The ZIP contains compiled Jetton build outputs, state-init files, a Mainnet deployment preview, metadata content, package lock, and an npm audit report. It does not contain the mining backend source tree, PWA assets, service worker, IndexedDB queue, offline lease implementation, or diagnostics client. It is therefore not a complete mining application package and does not prove offline mining functionality.

The ZIP's deployment preview is tied to source commit 8b9e8cce..., whereas the audited repository HEAD is fc1c2e317.... Do not label this local ZIP as the latest repository snapshot. The preview is unsigned and is not evidence of Mainnet deployment.

## 7. Implementation blockers and safe next steps

1. Keep the public mining API fail-closed.
2. Implement verified TON wallet ownership and authoritative Jetton balance snapshots before replacing the legacy engine.
3. Build an installable client application; Telegram bot UI alone cannot provide offline access.
4. Implement a signed, short-lived offline lease issued only while online, with explicit maximum duration and reward cap.
5. Store provisional events locally in IndexedDB and sync them idempotently after reconnection.
6. Reconcile on the server against lease, device binding, event sequence, account policy, and the 1,050,000,000 VCOIN mining reserve; only then credit confirmed rewards.
7. Add diagnostics with explicit user consent and secret redaction.
8. Add automated offline, replay, clock tampering, storage recovery, duplicate, and concurrency tests.
9. Produce a new full application/backend release ZIP only after implementation and CI evidence.

## 8. Audit conclusion

**Action #48.2 audit completed; implementation remains pending.** No source code was changed in this audit. No extraction, payout, Jetton issuance, or blockchain transaction was performed. The next safe coding action is to define and implement the offline lease and reconciliation protocol alongside the wallet-balance mining design, without enabling public mining prematurely.
