# V COIN (VCOIN) — TON Jetton Smart Contract Specification

**Document ID:** VCT-JETTON-SPEC-001  
**Version:** 1.2.0  
**Status:** VCOIN Master, Wallet, genesis coordinator and founder vesting implemented; 19 emulator tests pass; adversarial review, independent audit and deployment pending  
**Network target for first rehearsal:** TON Testnet only  
**Token standard:** TEP-74 (Jettons), with TEP-64 metadata  
**Repository scope:** V-Coin-TON

> This is the binding technical design brief for the VCOIN Jetton implementation. It is not compiled contract code, a deployed token, a legal opinion, or authorization to deploy or transfer assets.

## 1. Approved token parameters

| Parameter | Required value |
|---|---|
| Name | V COIN |
| Symbol | VCOIN |
| Decimals | 6 |
| Initial supply | 10,000,000,000 VCOIN |
| Initial supply in base units | 10,000,000,000,000,000 |
| Additional minting | Permanently disabled after initial issuance |
| Standard | TON Jetton, TEP-74 |
| Metadata | TEP-64 compliant |
| First deployment target | TON Testnet |
| Mainnet | Disabled pending separate explicit approval |

The total supply is 10^16 base units. All token arithmetic must use integer base units; floating-point arithmetic is prohibited.

## 2. Required contract components

1. **VCOIN Jetton Master:** fixed 10^16 base-unit cap, immutable metadata, deterministic wallet derivation and a five-slot one-time genesis flow; no reference admin mint, metadata mutation or code-upgrade interface.
2. **VCOIN Jetton Wallet:** TEP-74 transfer/burn behavior plus a one-time genesis credit marker, acknowledgement/replay handling and bounded failure notifications.
3. **VCOIN Genesis Coordinator:** narrowly scoped dispatcher for the five precommitted allocation slots; it does not accept arbitrary recipients or amounts.
4. **Founder Vesting:** separate on-chain 48-month UTC calendar vesting contract for the 2B founder allocation.
5. **Off-chain deployment and verification scripts:** still required for reproducible state initialization, deployment, getter verification and address manifest.

The implementation must follow the active TEP-74 interface and TON security recommendations. TEP-89 wallet discovery may be added if the selected implementation supports it and interoperability tests pass.

## 3. Fixed initial allocation

The initial issuance must equal exactly 10,000,000,000 VCOIN.

| Allocation | Percent | VCOIN | Base units |
|---|---:|---:|---:|
| Founder | 20% | 2,000,000,000 | 2,000,000,000,000,000 |
| Mining reserve | 50% | 5,000,000,000 | 5,000,000,000,000,000 |
| Treasury | 10% | 1,000,000,000 | 1,000,000,000,000,000 |
| Liquidity / market | 10% | 1,000,000,000 | 1,000,000,000,000,000 |
| Ecosystem / marketing | 10% | 1,000,000,000 | 1,000,000,000,000,000 |
| **Total** | **100%** | **10,000,000,000** | **10,000,000,000,000,000** |

The VCOIN Master implementation validates the five fixed allocation amounts and rejects any configuration whose allocations do not sum exactly to the approved total. Five allocation destination addresses have now been supplied privately by the project owner and passed offline TON friendly-address checksum/workchain-format validation. This does not prove wallet ownership or on-chain account state. The actual addresses are intentionally excluded from this public specification; see `docs/ALLOCATION_DESTINATIONS.md` for the private-manifest process and remaining verification gates. The founder wallet is the vesting beneficiary; the founder allocation must be funded to a separately audited vesting contract, not sent unlocked directly to the beneficiary.

## 4. Supply and minting invariants

1. No issuance beyond the exact initial supply is permitted.
2. Initial issuance must be a one-time, owner-authorized deployment operation with a verifiable transaction trail.
3. The issuance state must transition irreversibly from not-issued to issued-and-locked.
4. After initial issuance, the Master must report mintable = 0 and reject every mint request.
5. No admin method, upgrade path, emergency method, metadata update, wallet method or backend service may recreate mint authority.
6. If the selected implementation cannot guarantee irreversible mint disablement, it is not acceptable for VCOIN.
7. Burning may reduce total supply. Burned tokens must never be reissued or counted as available mining reserve.
8. Supply and allocation totals must be checked on-chain after issuance. A database record is not proof of issuance.

**Implemented issuance model:** the VCOIN Master uses five immutable genesis slots and a fixed coordinator address. Each slot completes only after a valid acknowledgement from the deterministic recipient Jetton Wallet. The Master tracks cumulative genesis-issued base units separately from burn-adjusted totalSupply. The emulator suite verifies the full five-slot flow, duplicate coordinator request idempotency, wallet replay protection and burn accounting. Bounced credit, acknowledgement loss/bounce, conflicting replay and wrong-sender/amount adversarial tests remain pre-Testnet gates.

## 5. Jetton Master interface and behavior

The Master provides the standard getters, including:
- get_jetton_data() — total supply, mintability, admin address, content and wallet code.
- get_wallet_address(owner_address) — deterministic Jetton Wallet address for the supplied owner address.

It must correctly process standard Jetton wallet deployment, burn notifications and any selected discovery interface. It must validate message sender and opcode for every privileged or supply-affecting operation.

The Master must not include a hidden mint, arbitrary balance editing, confiscation, blacklist seizure, or owner withdrawal function that can move tokens from user wallets.

## 6. Jetton Wallet interface and behavior

Each owner wallet implements the applicable TEP-74 behavior, including:
- get_wallet_data() — balance, owner, Master address and wallet code.
- Standard transfer handling with sender authorization and sufficient-balance checks.
- Standard internal transfer processing with correct sender/Master validation.
- Standard burn handling and Master burn notification.
- Correct bounce handling and excess return behavior.
- Safe forwarding of TON and payload handling according to TEP-74.

The wallet must reject unauthorized balance changes, malformed messages, wrong-Master messages, insufficient balances and invalid sender relationships. All amount calculations use integer base units.

## 7. Metadata and identity

Metadata must follow TEP-64. The canonical Master address on the selected network is the token identity. Name, ticker, icon, website and metadata URI are descriptive only and must never be used as proof that a token is authentic.

Before any user-facing integration, pin and verify the exact Master address and network. Never substitute a USDT Master address, sample Jetton, test token, or a user's per-owner Jetton Wallet address.

Metadata mutability must be explicitly decided before implementation. Recommended default: immutable metadata after initial deployment, unless the owner separately approves a narrowly constrained and auditable update mechanism before deployment.

## 8. Allocation-specific controls

### 8.1 Founder allocation — 2 billion VCOIN

The owner-approved economic rule is four-year vesting in 48 monthly tranches. The vesting clock starts at the official mining activation timestamp, not at Jetton deployment. The beneficiary is the founder wallet supplied privately by the owner; it must not be committed to this public repository. The deployment/activation procedure must record one immutable `mining_start_timestamp` and initialize the vesting schedule from that exact value. No tranche may be released before its monthly due time. The 48 tranche amounts must sum exactly to 2,000,000,000,000,000 base units; any integer-division remainder must be assigned deterministically to the final tranche. No revocation or beneficiary substitution is permitted unless separately approved and audited. The vesting implementation must be a separately reviewed contract or a proven, audited lock mechanism; a database timer is not an on-chain lock. No founder identity or confidential address should be placed in public documentation.

### 8.2 Mining reserve — 5 billion VCOIN

The reserve is a hard cap. The mining distributor must not mint. It may transfer only from the funded reserve and must enforce atomic reservation, idempotency, reconciliation and a hard stop when the reserve is exhausted.

The approved mining rule is separate from the Jetton token contract: the next mining interval uses the user's verified on-chain VCOIN balance in the linked wallet; reward rate is 1% per 24 hours at every level 1–400; six-decimal integer base units; pending internal rewards do not count as wallet holdings. Mining API remains disabled until wallet-proof, balance-reader and payout requirements pass.

### 8.3 Treasury, liquidity and ecosystem allocations

Each destination and its controller must be owner-confirmed. Custody model, multisig threshold, timelocks, vesting/lock conditions and operational policies must be specified in separate reviewed documents before any transfer or deployment. Do not publish confidential controller identities or addresses.

## 9. Admin, upgradeability and custody

- No contract upgradeability or proxy mechanism is permitted unless separately justified, explicitly approved and independently audited.
- The Master must not retain mint authority after initial issuance.
- Any temporary deployment authority must be minimized and removed/locked as part of the verified issuance procedure.
- Administrative keys must use an owner-approved secure wallet or multisig arrangement. The exact controller and threshold are deployment decisions still pending.
- Never request, store, log, transmit or paste seed phrases or private keys into the repository, backend, chat or deployment scripts.
- Wallet transactions must be signed in the user's wallet interface.

## 10. Required tests

The implementation is not acceptable for Testnet until automated tests demonstrate:
1. Exact initial supply and exact five-bucket allocation sum.
2. Six-decimal/base-unit arithmetic with no floating-point conversions.
3. One-time issuance succeeds only once.
4. Every mint attempt after lock is rejected.
5. Master getters return correct supply, mintable = 0, metadata and wallet code.
6. get_wallet_address(owner) is deterministic and correct.
7. Wallet getter reports the expected owner and Master.
8. Valid transfers update balances correctly.
9. Unauthorized transfers, wrong-Master messages and insufficient balances are rejected.
10. Burn reduces supply and cannot enable re-minting.
11. Bounce, excess, malformed payload and replay cases are safe.
12. Allocation destinations and any vesting/distributor restrictions behave as specified.
13. Testnet explorer state and transaction traces match local test results.

**Executed evidence:** the pinned Acton CI run passes 19 tests across the upstream TEP-74 baseline, VCOIN genesis invariants, five-slot Master/coordinator, wallet genesis replay and founder vesting. Static checks and formatting pass. The suite currently covers the exact supply/allocation sum, fixed decimals, full genesis flow, duplicate genesis request, wallet replay without double credit, burn accounting, vesting bounce recovery, first and final vesting tranches, and UTC month-end/leap-year behavior. The remaining adversarial cases above, independent security review and Testnet explorer verification are not yet complete. Tests must never be reported as passing unless actually executed.

## 11. TON purchase settlement requirements

A TON purchase is a payment to the founder's externally controlled TON wallet, not a deposit into the VCOIN Jetton Master or a contract-controlled treasury. The founder may withdraw or use received TON at any time. This immediate TON access is separate from the founder's VCOIN allocation, which remains subject to its 48-month vesting lock.

The purchase service must not issue or promise VCOIN based solely on a client callback, screenshot, wallet connection, or unverified transaction hash. It must verify the transaction against a trusted TON data provider and validate the exact receiving founder address, network, amount in nanotons, transaction success/finality policy, sender wallet where applicable, quote/order identifier, expiry, and unique transaction identity. It must persist the transaction hash and logical transaction identity under a database uniqueness constraint, bind each accepted payment to exactly one order, and process settlement idempotently. Replayed, underpaid, overpaid, expired, wrong-network, wrong-recipient, failed, or already-consumed transactions must not trigger a second payout. The payout worker may instruct the separately controlled mining-reserve Jetton wallet/distributor to transfer the purchased VCOIN only after verified payment; it must reconcile the Jetton transfer transaction and mark the order complete only after confirmation. Never store seed phrases or private keys in the backend; reserve transfers must be signed by an explicitly approved secure signer or wallet.

The exchange rate, quote lifetime, rounding policy, minimum/maximum purchase, refund/overpayment handling, confirmation policy, and reserve signer custody must be configured and reviewed before enabling purchases. Do not hard-code an assumed market price or infer a conversion rate from the modelled reference-price chart.

## 12. Deployment and release gates

**Current state: NO-GO. No deployment is authorized by this document.** VCOIN-specific Master, Wallet, genesis coordinator and founder vesting source code compile and pass 19 emulator tests. The five destination address strings have been format/checksum-validated offline, but wallet control, final deployment manifest, Testnet rehearsal, independent adversarial review and security audit remain outstanding.

Before Testnet deployment:
- Use TON's current Tolk toolchain for the Jetton implementation, based on the official Acton Jetton v2.1 Tolk sources; pin exact compiler/toolchain versions and upstream source commit in the implementation manifest. Do not use the archived Tact Jetton implementation as the project baseline.
- Complete Master and Wallet source code, build configuration, deployment scripts and automated tests.
- Obtain owner approval for all five destination addresses and any distribution vault.
- Resolve founder vesting start, release schedule and beneficiary.
- Resolve treasury/liquidity/ecosystem custody and controller arrangements.
- Reproducibly compile and verify contract artifacts.
- Complete independent smart-contract review.
- Prepare a Testnet-only deployment manifest and confirm the network in every wallet and explorer.
- Deploy only after explicit owner approval of the exact transaction and destination addresses.
- Verify Master address, getters, supply, metadata, wallet code and allocation balances on Testnet.

Mainnet deployment, initial issuance on Mainnet, liquidity provision, irreversible admin changes and real-value transfers require separate explicit approval after independent security review.

## 13. Change control

Any change to supply, decimals, allocation, mint prohibition, wallet transfer semantics, admin powers, metadata mutability, vesting or mining reserve controls requires a documented change request, impact analysis, tests and explicit project-owner approval.

## 14. Official standards and technical references

- TEP-74 Jettons Standard: https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md
- TON Jetton architecture: https://docs.ton.org/contracts/standard/tokens/jettons/how-it-works
- TON Jetton payment/security guidance: https://docs.ton.org/applications/payments/jettons
- TON Jetton implementation comparison: https://docs.ton.org/contracts/standard/tokens/jettons/comparison

**Document status:** VCOIN Master, Wallet, genesis coordinator and founder vesting implementation is compiled and passes 19 emulator tests plus static checks and formatting. Backend and Mining CI also pass. Independent security review, remaining adversarial tests, deployment scripts, wallet ownership proof, on-chain mining balance reader, payout and purchase settlement remain pending. No Testnet/Mainnet deployment or mining activation has occurred.