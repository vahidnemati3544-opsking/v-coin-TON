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

### Outstanding — requires Founder wallet interaction

- [ ] For each of the five registered owner addresses, open the intended TON Mainnet wallet interface and confirm the displayed address matches the registered address.
- [ ] Where supported, verify each address using a non-spending signed challenge / TON Connect signData proof. Record only public proof, address, network, timestamp, and result. Do not share or store recovery phrases, private keys, PINs, or secret QR material.
- [ ] Do not use a transfer or zero-value transaction as a proof method; no transaction is authorized for this action.
- [ ] Mark each address verified only after its proof is actually inspected. A Founder declaration or a matching address in a JSON file is not cryptographic proof of key control.

### Safe execution procedure

1. Use TON Mainnet, not Tonkeeper Dev/Testnet.
2. Compare each displayed owner address with the five addresses in the canonical policy and deployment template.
3. If the wallet supports a non-spending data signature, sign only a unique challenge string that contains no transaction payload and does not request a transfer.
4. Verify the returned signature against the corresponding public address using a trusted verifier before marking that wallet complete.
5. If signed-message verification is not supported, record the check as operational access observed but cryptographic control proof pending. Do not invent a substitute or mark it complete.
6. Keep the separate TON operations/fees wallet distinct from the five VCOIN allocation wallets.

**Current status:** configuration and CI checks complete; per-address Founder control evidence pending. This is the next release gate and blocks any Mainnet deployment or allocation transaction.

**After Action 26:** proceed to the final exact-head artifact review: verify the current StateInit/manifest hashes and derived Master address, inspect the deployment fee estimate against the Founder-set 1 TON target / 3 TON hard ceiling, and prepare a human-readable unsigned transaction preview. Require explicit Founder approval before any local signing. External audit/conformance requirements and all other open release gates remain governed by the current readiness dossier; this tracker does not waive them.
