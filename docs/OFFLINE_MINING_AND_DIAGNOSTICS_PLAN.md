# V COIN – Offline-First Mining & Self-Diagnostics Plan
**Action:** #48  
**Status:** Architecture plan committed; implementation and verification pending  
**Scope:** Independent V COIN–TON project only. This document does not alter the legacy BNB project, token supply, allocations, or deployment state.

## 1. Objective

Allow a user who has already installed and initialized the V COIN mining application to continue a **provisional local mining session** during an internet outage, including outages affecting Iran. The same behavior must be available to users in every supported country.

When connectivity returns, the client submits its locally queued session records. The backend validates them, applies anti-fraud and reward-cap rules, and records accepted rewards. Offline balances are always labelled **Pending / Not yet verified** until server acceptance.

This is an offline-first user experience, not offline blockchain settlement. No client can write to TON or obtain a globally final reward while disconnected.

## 2. Critical product constraints

1. **Pre-installation is required:** a user must have opened/installed the PWA and downloaded its application shell and required configuration while online at least once. A first-time user with no cached application cannot start during a complete outage.
2. **Telegram is not an offline transport:** Telegram bot screens, login, referrals, and server APIs cannot be reached without connectivity. The cached V COIN app must provide the offline mining screen independently; Telegram can resume when online.
3. **Provisional only:** local counters and queued events are not spendable VCOIN, cannot be withdrawn, transferred, upgraded against, or treated as confirmed rewards before reconciliation.
4. **No trust in device clock:** wall-clock time supplied by the client is not authoritative. Offline accrual must be bounded by a short server-issued signed session lease and conservative elapsed-time rules. Device clock changes, app restarts, missing checkpoints, or inconsistent monotonic-time evidence must trigger review or rejection, not extra rewards.
5. **No unlimited offline mining:** define a configurable maximum offline lease/window, maximum queued sessions, per-account/device rate limits, and a maximum provisional amount. These values must be set after threat modelling and load tests; do not hardcode a promise of unlimited offline extraction.
6. **Global fairness:** apply the same protocol and reward formula across regions. Do not use IP geolocation as proof of identity or eligibility. Handle delayed synchronization without penalizing a user solely because their network was unavailable, subject to the lease and anti-fraud limits.
7. **Supply protection:** all accepted mining rewards must debit the existing 1,050,000,000 VCOIN mining allocation. Never mint beyond the approved fixed supply of 2,100,000,000 VCOIN (6 decimals); do not introduce a new token allocation or minting path.
8. **No wallet secrets:** never collect seed phrases, private keys, wallet PINs, or signing secrets for mining or diagnostics.

## 3. Target architecture

### 3.1 Client: installable offline-first application

- Deliver a PWA shell over HTTPS with a versioned service worker and precached, integrity-checked HTML, JavaScript, CSS, icons, and the minimum mining configuration.
- Store structured local records in IndexedDB; use Cache Storage only for static application assets and cacheable read-only resources.
- Keep a local state machine: READY, MINING_PROVISIONAL, QUEUED_FOR_SYNC, SYNCING, ACCEPTED, REJECTED, REVIEW_REQUIRED.
- Show connectivity status and separate **provisional** from **confirmed** balances in every screen.
- Persist a session checkpoint and append-only event records. Each event includes a cryptographically random event ID, account/device pseudonymous identifier, lease ID, sequence number, app/rules version, start/end checkpoint references, and integrity hash.
- Use Web Crypto for local integrity protection where supported. Client-side hashes are tamper-evident aids, not proof against a hostile device.
- Do not rely on Background Sync being universally available. On app resume, online event, and explicit user action, attempt synchronization with exponential backoff and jitter. If unavailable, retain the queue safely.
- Do not promise mining while the app is force-closed or the operating system suspends it. Browser service workers are event-driven and may be stopped by the browser. For guaranteed background execution, evaluate a separately reviewed native Android implementation and its platform restrictions.

### 3.2 Server: authoritative reconciliation

- Issue a short-lived, signed offline lease only after online authentication and risk checks. Lease binds account, device key, policy version, start allowance, maximum duration, and unique lease ID.
- Verify lease signature, expiry allowance, account/device binding, event sequence, event IDs, app version, policy version, and integrity chain.
- Make synchronization idempotent: unique database constraints on event IDs and lease/sequence pairs prevent duplicate credits on retries.
- Reconcile in a database transaction. Record raw submissions, validation outcome, reason codes, accepted duration, accepted reward, and audit timestamps.
- Enforce global account/device concurrency rules, referral eligibility, level rules, rate limits, and the remaining mining allocation.
- Use server-calculated rewards only. Never accept a client-supplied reward amount as authoritative.
- Resolve duplicates/replays deterministically. Conflicting or out-of-order events go to REVIEW_REQUIRED; never silently double-credit.
- Maintain a durable audit trail and an operator-safe replay tool that can reprocess a submission without issuing a second credit.

### 3.3 Database additions (proposed; do not apply until schema review)

Proposed entities:
- offline_mining_leases: lease ID, account ID, device public key fingerprint, policy version, issued/maximum expiry, signature key ID, status.
- offline_mining_events: event ID, lease ID, sequence, client checkpoints, payload hash, received time, validation status, rejection reason.
- mining_sync_batches: batch ID, account ID, received time, processing status, idempotency key.
- mining_reconciliation_audit: accepted duration/reward, ruleset version, ledger reference, reviewer/action metadata.
- device_risk_signals: privacy-minimized risk flags and app version; no secrets or unnecessary personal data.

All reward postings must use the existing authoritative ledger and database transaction model. Do not create a parallel balance that can diverge from the ledger.

## 4. Security and anti-fraud controls

- Treat every offline client record as untrusted input.
- Prevent replay through unique event IDs, lease IDs, sequence numbers, and database uniqueness constraints.
- Detect multiple active leases, overlapping sessions, impossible elapsed time, excessive device-clock drift, rollback, app downgrade, tampered policy versions, and repeated account/device switching.
- Apply a conservative maximum offline duration and amount; route anomalies to manual review.
- Bind leases to a registered device public key where feasible. Device key storage is platform-dependent and is not equivalent to hardware-backed attestation on every browser.
- Never claim that browser-side encryption, hashes, or device IDs make a rooted/jailbroken or modified client trustworthy.
- Protect sync endpoints with authentication, authorization, request-size limits, rate limiting, TLS, schema validation, and abuse monitoring.
- Keep diagnostic logs privacy-minimized. Redact authorization headers, tokens, wallet addresses where not needed, personal messages, and all secrets.

## 5. Self-diagnostics and remote troubleshooting

The client must expose a user-consented **Diagnostics** report containing:
- app build/version and offline ruleset version;
- browser/OS family and feature-support flags;
- service-worker registration and cache version/state;
- IndexedDB availability, queue count, oldest queued item age, and storage errors;
- current state-machine state and last successful sync timestamp;
- last sync error category, HTTP status where applicable, retry count, and correlation ID;
- lease validity state (never the lease secret or signing material);
- a redacted event/queue integrity summary.

The backend must provide:
- structured logs with correlation IDs;
- metrics for lease issuance, queued submissions, accepted/rejected/reviewed events, sync latency, duplicate attempts, and ledger posting failures;
- health/readiness endpoints for API, database, queue worker, and ledger;
- alerts for elevated error rates, backlog age, reconciliation failures, database saturation, and mining-cap exhaustion;
- an operator runbook with safe replay, quarantine, rollback, and incident escalation steps.

Support workflow:
1. User opens Diagnostics and explicitly chooses Export/Send report.
2. The app redacts secrets locally and displays the report before submission.
3. The user can copy/download the report or submit it when online.
4. Support searches by correlation ID and diagnoses the failure using server logs.
5. Support may retry reconciliation idempotently; support tools must never fabricate rewards or bypass the mining cap.

## 6. Required test matrix

### Offline behavior
- Install and open the app online, then enable airplane mode and reopen from the installed app.
- Confirm cached mining UI loads without network.
- Start, pause, resume, and end a provisional session offline.
- Restart the browser/device and verify persisted queue recovery.
- Fill storage quota and verify safe failure without losing acknowledged records.
- Upgrade app/ruleset and verify old queued records remain interpretable or are explicitly quarantined.

### Synchronization and consistency
- Restore connectivity and submit one batch; verify accepted records are posted once.
- Submit the same batch repeatedly; verify no duplicate ledger entries.
- Simulate timeout after server commit but before client acknowledgement; retry and verify idempotency.
- Submit missing, duplicate, reordered, overlapping, expired, altered, and wrong-device events.
- Verify rejected/reviewed events do not increase confirmed balance.
- Verify reward posting and mining reserve decrement are atomic.

### Fraud and resilience
- Change device wall clock forward/backward.
- Clear app data, reinstall, clone local database, replay events, and attempt concurrent sessions.
- Simulate API/database outage and recovery.
- Test slow, intermittent, captive-portal, and fully unavailable networks.
- Verify the same rules across supported regions and supported Android/browser combinations.

### Operational acceptance
- No confirmed credit before server reconciliation.
- No duplicate ledger postings under retry/replay.
- No reward above lease, policy, user, or global mining-reserve limits.
- Diagnostics contain no secrets.
- All critical failures produce a correlation ID and actionable reason code.
- Load, security, privacy, and independent review sign-off before production activation.

## 7. Implementation sequence and checkpoints

| Step | Work item | Status | Exit evidence |
|---|---|---|---|
| 48.1 | Approve offline-first product and trust boundaries | Planned | Product/security review |
| 48.2 | Audit current mining engine, API, ledger, auth, and schema | Done — see [MINING_OFFLINE_CURRENT_STATE_AUDIT.md](./MINING_OFFLINE_CURRENT_STATE_AUDIT.md) | Audit recorded at Action #49; no offline client/lease/sync implementation exists yet |
| 48.3 | Define signed lease protocol and threat model | Protocol drafted in Action #50; review pending | Key rotation and security review sign-off |
| 48.4 | Implement PWA shell, service worker, and cache strategy | Initial shell committed in Action #50; browser tests pending | HTTPS install/offline/open tests |
| 48.5 | Implement IndexedDB event queue and state machine | Pending — only IndexedDB diagnostics read path exists; mining event queue not implemented | Append-only queue and persistence/restart tests |
| 48.6 | Implement authenticated idempotent sync endpoint | Pending | Retry/replay integration tests |
| 48.7 | Implement server reconciliation and ledger integration | Pending | Atomic ledger and reserve tests |
| 48.8 | Implement diagnostics export and redaction | Pending | Privacy/security tests |
| 48.9 | Add monitoring, alerts, and support runbook | Pending | Staging alert drill |
| 48.10 | Run offline, fraud, device, and load test matrix | Pending | CI report and test evidence |
| 48.11 | Independent security review and production approval | Pending | Written sign-off |

## 8. Release gates

This plan is not evidence that offline mining has already been implemented. Do not enable user-facing offline rewards until steps 48.2–48.11 are completed and reviewed. Mainnet deployment, Jetton issuance, and wallet transactions remain separate activities and are not authorized by this plan.

## 9. Technical references

- MDN, Offline and background operation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
- MDN, Background Synchronization API (limited availability): https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- MDN, Client-side storage: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Client-side_storage

These platform APIs support offline caching and deferred synchronization, but browser scheduling and background execution are not guaranteed. The application must therefore work safely with foreground retry and must not promise continuous mining while an app is closed.


## Action #50 — first implementation foundation (2026-11-22)

- Added protocol document: [OFFLINE_LEASE_AND_WALLET_TRUST_PROTOCOL.md](./OFFLINE_LEASE_AND_WALLET_TRUST_PROTOCOL.md).
- Added additive migration 008 for Jetton balance snapshots, device public-key records, offline leases, sync batches, event replay constraints, and reconciliation audit.
- Registered migration 008 in the local database setup script. It has not been applied to any database.
- Added an Ed25519 canonical-payload signing/verification utility and unit tests. The module is not connected to lease issuance or any public route; no private key is stored in the repository.
- Added the initial installable PWA shell, manifest, and service worker. It currently supports shell caching and local diagnostics export only. It does not yet implement mining, signed-lease verification in the browser, or an IndexedDB mining-event queue.
- Public mining remains HTTP 503. No wallet ownership proof adapter, trusted TON balance reader, reconciliation worker, payout, or Mainnet transaction was added.
- The available ZIP is a Jetton build artifact and does not contain the backend/client source. It was not modified or relabeled as a full application release.
