# V COIN–TON Mainnet Release Action Tracker

**Checkpoint:** 2026-11-21  
**Scope:** TON project only. No changes to the legacy BNB project.  
**Release state:** HOLD — no Mainnet deployment, mint, transfer, signature, or broadcast authorized.

## Action 26 — Verify Founder control of all five Mainnet allocation wallets

**Purpose:** Complete the next mandatory release gate after governance policy and deployment configuration were aligned with the Founder-exclusive five-wallet rule.

### Completed read-only checks

- [x] Canonical Founder-exclusive policy exists: `docs/FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md`.
- [x] All five Mainnet owner addresses in `contracts/jetton/deployment.config.template.json` exactly match the Founder-approved register.
- [x] All five recipient addresses in `contracts/jetton/allocation-manifest.template.json` exactly match the deployment configuration.
- [x] The five addresses are distinct.
- [x] Allocation amounts sum to exactly 10,000,000,000 VCOIN / 10,000,000,000,000,000 base units.
- [x] All five allocation manifest entries require a Founder signature.
- [x] Deployment and Mainnet authorization flags remain false.
- [x] GitHub Actions run #44944859076 passed on reviewed source commit `b1ceaeb07b95d3882d58123b4572b290dafed6ee`: metadata/PNG verification, read-only Mainnet identity check, build, deployment generator type-check, offline production-metadata StateInit candidate preparation, test suite, dependency security gate, and artifact upload all passed. Run: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44944859076
- [x] The five address strings supplied during the Founder-led wallet review match the five registered Mainnet owner addresses exactly. This is a text-match observation only; the wallet UI source, network context, and cryptographic key control have not been independently verified by the backend.

### Outstanding — cryptographic proof

- [ ] Obtain one valid, non-spending TON Connect `ton_proof` for each of the five registered owner addresses.
- [ ] Start with Founder only. Continue to the other four roles only after the Founder proof is verified.
- [ ] Do not use a transfer or zero-value transaction as a proof method; no transaction is authorized.
- [ ] Do not request or store recovery phrases, private keys, PINs, or secret QR material.
- [ ] Mark a role `verified` only after StateInit/address binding, public-key resolution, domain, Mainnet network, timestamp, one-time nonce, and Ed25519 signature checks all pass.

### Safe execution procedure

1. Use TON Mainnet network ID `-239`, not Testnet.
2. Use the fixed role/address allowlist in `docs/FOUNDER_EXCLUSIVE_FIVE_WALLET_CONTROL.md`.
3. Issue a random, single-use server nonce bound to the role, exact address, dApp domain, and browser login attempt.
4. Request only TON Connect `ton_addr` and `ton_proof`; never request a transaction.
5. Verify the returned proof against the expected dApp domain and the public key derived from validated wallet StateInit (or a reviewed on-chain fallback where appropriate).
6. If a wallet does not return a usable proof, record it as unsupported/pending. Do not substitute a transfer or claim success.
7. Keep the separate TON operations/fees wallet distinct from the five VCOIN allocation wallets.

**Current status:** configuration and earlier CI checks complete; address strings match the register; cryptographic control evidence remains pending. This gate blocks any Mainnet deployment or allocation transaction.

## Action 27 — Prepare one reusable TON Connect proof flow for all five wallets

**Requested scope:** The Founder asked for the proof process to be prepared for all five wallets, with the Founder wallet tested first.

### Completed

- [x] Created `docs/TON_CONNECT_FIVE_WALLET_PROOF.md` with the five-address allowlist, Mainnet-only policy, Founder-first flow, nonce/session requirements, StateInit/address binding, public-key validation, Ed25519 verification, replay prevention, Gram Wallet compatibility gate, evidence statuses, and explicit no-transaction boundary.
- [x] Confirmed the existing backend codebase is under `contracts/mining/backend`; there is no confirmed production dApp hostname or browser wallet-connect UI in the inspected repository tree.
- [x] Since the Founder has no custom domain, prepared a GitHub Pages project-site scaffold at `wallet-proof/index.html` and `wallet-proof/tonconnect-manifest.json`, using the registered canonical PNG logo. Proposed HTTPS origin: `https://vahidnemati3544-opsking.github.io/v-coin-TON`.
- [ ] Enable GitHub Pages for the repository and publish the scaffold; then independently verify the public page, manifest JSON response, CORS behavior, and icon URL before using it in a wallet request.
- [x] Confirmed that the backend currently has no wallet-proof routes. No live proof endpoint has been implemented or deployed by this documentation-only action.

### Pending implementation blockers

- [x] Founder confirmed no custom domain is available; use the proposed free GitHub Pages project-site hostname for the initial proof prototype.
- [ ] Enable and publish GitHub Pages; verify HTTPS reachability of the page, manifest, and icon before treating the hostname as active.
- [ ] Bind backend proof verification to the exact published hostname.
- [ ] Implement frontend TON Connect request flow and backend challenge/verification routes.
- [ ] Implement reviewed wallet StateInit public-key extraction for supported wallet code versions, plus strict validation and tests.
- [ ] Add durable one-time challenge/session storage, origin checks, and rate limits.
- [ ] Run CI and test the real Gram Wallet response. If it does not return `ton_proof`, record unsupported; do not use a transaction as a substitute.
- [ ] Verify Founder first, then verify each of the other four wallets separately.

**Current status:** specification prepared in Git; executable integration pending domain/manifest and implementation. This action does not authorize deployment, minting, transfer, signing, or broadcast.

**After Action 27:** once the production hostname is selected, implement and test the proof service. Only after successful Founder verification should the other four wallet proofs be requested. Keep the release state HOLD until all existing independent readiness gates and the exact transaction approval process are complete.


## Action 28 — Confirm Gram Wallet / WalletTg proof integration path

**Requested scope:** Begin the Founder-only non-spending wallet-control verification from Gram Wallet using the documented TON Connect proof mechanism.

### Completed

- [x] Reviewed current official TON documentation identifying WalletTg as the wallet contract used by Telegram's native Gram wallet.
- [x] Confirmed official TON WalletTg integration guidance describes TON Connect and ton_proof support.
- [x] Added `docs/GRAM_WALLET_TON_PROOF_COMPATIBILITY.md` with the WalletTg trampoline code-hash gate, active-account validation, current-key lookup via `get_public_key()`, key-rotation handling, and Founder-first test procedure.
- [x] Linked the compatibility note from `docs/README.md`.

### Pending — no proof has been attempted yet

- [ ] Register and configure a neutral production HTTPS domain; do not publish or use the GitHub username-based hostname for Founder identity verification.
- [ ] Publish and verify the TON Connect manifest at the approved neutral domain.
- [ ] Implement the live frontend and secure backend challenge/verification routes; the existing backend currently has no such routes.
- [ ] Connect Gram Wallet from the approved dApp page and inspect its actual ton_proof response.
- [ ] Verify the Founder proof cryptographically using the WalletTg-specific checks; do not proceed to the other four wallets before success.

**Current status:** official protocol compatibility path documented; no live connection, proof request, signature, or cryptographic verification has occurred. No transaction, deployment, mint, or transfer is authorized. Release remains HOLD / NO-GO.
