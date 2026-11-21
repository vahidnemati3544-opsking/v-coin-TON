# V COIN – TON Jetton Deployment Runbook

**Status:** Implementation/deployment gate; NOT deployed  
**Standard:** TEP-74 Jetton, metadata TEP-64  
**Initial supply:** 10,000,000,000 VCOIN  
**Decimals:** 6  
**Initial supply in base units:** 10000000000000000  
**Recorded founder allocation wallet (ownership unverified):** UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy  
**GAS & OPERATIONS wallet (TON fees only; not a VCOIN allocation):** UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB

## 1. Non-negotiable design

1. Use the maintained TON Foundation / ton-blockchain Jetton reference implementation as the compatibility baseline; pin an exact upstream commit before building.
2. Mint the approved initial supply exactly once. The contract must enforce the 10,000,000,000 VCOIN cap in code, not only in the deployment script.
3. After initial issuance, permanently disable minting. Prefer an explicit immutable/one-time issuance state transition over relying only on an operator promise.
4. Do not include hidden freeze, confiscation, arbitrary clawback, or post-transfer seizure functionality.
5. Keep metadata immutable after launch, or make any pre-launch metadata update capability explicit and revoke it before Mainnet launch.
6. Use integer base units throughout. Never use floating-point token arithmetic.
7. No production deployment until source, compiled code hash, test evidence, and independent review are recorded.

## 2. Founder authority and custody

The founder is the operational approver for distributions from founder-controlled custody. The recorded founder allocation wallet above is a candidate destination, not proof of ownership; it must pass TON Connect proof/signature verification on the intended network. The separate GAS & OPERATIONS wallet is reserved for TON fees and operational funding only; it is not the founder's VCOIN allocation destination.

Founder authority is implemented through transaction authorization:
- backend creates a proposal only;
- proposal contains exact network, Jetton master, recipient, amount in base units, and unique idempotency key;
- founder reviews the exact details in Tonkeeper or another TON wallet;
- only the wallet can sign and broadcast;
- backend independently verifies the confirmed transaction on-chain.

A backend role or database flag must never be treated as permission to move tokens.

A confirmed TON transfer to an independently controlled wallet cannot be reversed by the founder. If the founder must retain control over an allocation, keep it in founder-controlled custody or use a disclosed, audited vesting/escrow contract with clearly specified beneficiary rights.

## 3. Approved allocation

| Allocation | VCOIN | Base units |
|---|---:|---:|
| Founder (4-year vesting) | 2,000,000,000 | 2000000000000000 |
| Mining reserve | 5,000,000,000 | 5000000000000000 |
| Treasury | 1,000,000,000 | 1000000000000000 |
| Liquidity / market | 1,000,000,000 | 1000000000000000 |
| Ecosystem / marketing | 1,000,000,000 | 1000000000000000 |
| **Total** | **10,000,000,000** | **10000000000000000** |

Allocation sums must be checked in base units before every batch. No category may exceed its approved cap.

## 4. Deployment sequence

### Gate A — source and build
- Import the maintained official Jetton reference implementation at a pinned commit.
- Apply the fixed-supply and one-time-issuance constraints.
- Review Jetton master and wallet behavior against TEP-74 and metadata against TEP-64.
- Build reproducibly; record compiler/toolchain versions and code hashes.
- Run unit, sandbox, negative, replay, authorization, transfer, burn, and supply-cap tests.

### Gate B — Owner-directed Testnet omission
- The owner has directed that no Testnet deployment be performed.
- This omits only the Testnet deployment stage; it does not waive reproducible builds, Sandbox/adversarial tests, independent security review, wallet-control proofs, deterministic transaction simulation, or explicit founder approval.
- Before Mainnet, verify the exact reviewed build, code hashes, master/wallet derivation, metadata serialization, supply cap, one-time issuance, all transfer/bounce paths, and fee assumptions using reproducible local/Sandbox evidence.
- Record the evidence and unresolved risks. If any critical path cannot be verified without a live Testnet transaction, stop and obtain the owner's explicit decision rather than silently weakening the gate.

### Gate C — Mainnet approval
- Complete independent smart-contract security review and close every critical/high finding.
- Review token distribution, consumer disclosures, sanctions/AML obligations, tax and securities/financial-services considerations with qualified counsel in relevant jurisdictions.
- Confirm all recipient addresses and custody/vesting arrangements.
- Confirm TON for deployment and transfer fees.
- Obtain explicit founder approval of the final build hashes, metadata, supply, and destinations.

### Gate D — Mainnet deployment and distribution
- Proceed only after the owner-directed Testnet omission has been compensated by complete reproducible Sandbox evidence and independent review.
- Deploy only the exact reviewed build.
- Verify deployed code and state on-chain.
- Issue the initial supply exactly once and verify total supply.
- Revoke/disable minting irreversibly as specified by the reviewed contract.
- Send each allocation only after the founder signs the exact transaction.
- Reconcile each confirmed transfer against the allocation ledger.
- Publish the Jetton master address and verified transaction references.

## 5. Recorded allocation recipient addresses

The following five public wallet addresses have been recorded as the current candidate destinations for the five VCOIN allocations. Recording an address does not prove wallet ownership or authorize a transfer. Each destination must be independently verified on the intended TON network before any distribution.

| Allocation | VCOIN | Recorded candidate destination | Verification status |
|---|---:|---|---|
| Founder (4-year vesting) | 2,000,000,000 | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` | Ownership unverified; vesting custody must be finalized |
| Treasury | 1,000,000,000 | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` | Ownership unverified |
| Liquidity / market | 1,000,000,000 | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` | Ownership unverified |
| Ecosystem / marketing | 1,000,000,000 | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` | Ownership unverified |
| Mining reserve | 5,000,000,000 | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` | Ownership unverified |

**Separate GAS & OPERATIONS wallet (TON fees only; no VCOIN allocation):** `UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB`.

The GAS & OPERATIONS wallet is not a substitute for TON held by a wallet that must sign a transaction. Sponsored fees or a relayer require separate implementation and testing.

Do not infer a recipient address from a wallet label, Telegram username, or a prior transaction. No transfer is authorized by this register; each transfer still requires exact transaction review and founder signature.

## 6. Mainnet stop conditions

Stop if any of the following is true:
- founder wallet proof fails or network is ambiguous;
- build is not reproducible or source/code hash differs from the reviewed build;
- initial supply or allocation sums do not match exactly;
- second mint succeeds;
- metadata or admin privileges remain outside the approved policy;
- recipient address has not been verified;
- transaction simulation, fee estimate, or chain data is unavailable;
- independent review or required legal review is incomplete.

## 7. Current evidence record

- Five allocation candidate destinations: recorded in Section 5; ownership/control verification pending.
- Separate GAS & OPERATIONS wallet: recorded for TON fees only; not an allocation recipient.
- TEP-64 metadata draft: `contracts/jetton/metadata.json`; URI pinned in `deployment.config.template.json` to immutable commit `49c462124a082ef6c850079b35c6f77c5bda6ea2`. The JSON contains name, symbol, description and six decimals; no image is included until the approved logo asset is committed.
- TEP-74 required response-destination fields were corrected to mandatory addresses for transfer, internal transfer, burn and burn notification. Excesses are routed to the required response destination.
- TEP-89 `include_address` behavior remains covered for both values.
- Latest PR-head GitHub Actions run #229 on head `6d9a7ebf6899d5872364ec8b37fc06f190c44f28` passed build and all 29 tests, with `npm ci` and `npm audit --audit-level=high` successful and zero known vulnerabilities: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44877792568.
- Backend CI #242 and Mining CI #244 also passed on this exact head: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44877792523 and https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44877792493.
- Earlier full run #191 passed 25 Sandbox/policy tests, build, `npm ci` using the committed lockfile, and npm audit with zero known vulnerabilities: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44837612965.
- The committed `contracts/jetton/package-lock.json` was used successfully by `npm ci` in runs #175, #176 and #177.
- Source-level TEP-74 notes: `docs/TEP74_CONFORMANCE_REVIEW.md`. This is not an independent audit or full certification.
- On a bounced `TokenTransferInternal`, the source Jetton wallet restores its token balance and emits the custom `JettonTransferBounce` callback to its owner. The founder vesting contract authenticates its configured escrow wallet and rolls back the matching `released` amount. Sandbox tests now simulate bounced internal-transfer and burn-notification envelopes to exercise both wallet bounce handlers; natural TVM failure injection and full balance/counter invariants remain mandatory before deployment.
- `@tact-lang/compiler@1.6.13` emits a deprecation warning; current build succeeds. No blind Tolk migration is authorized.
- Jetton master address: not deployed.
- Deployment transaction: none.
- Initial mint transaction: none.
- Mainnet allocation transfers: none.
- Founder four-year vesting/escrow source: implemented in `contracts/jetton/src/founder-vesting.tact` with dedicated Sandbox tests. Approved schedule is 1,460 daily linear accrual steps over four 365-day years, zero cliff; clock starts only after the exact 2B VCOIN allocation is received from the founder through the configured authentic Jetton wallet. Authenticated downstream-bounce callback and rollback tests are now implemented; natural TVM bounce-path and balance/counter invariant tests remain a hard blocker. Do not deploy or fund the vesting contract.
- Escrow Jetton wallet address is configured once after vesting-contract deployment using the master `get_wallet_address` getter and a founder-signed message. It cannot be replaced after configuration.
- Vesting contract deployment/funding, final-head CI verification, natural downstream-bounce tests, independent security audit and Mainnet wallet-control proofs: pending. Testnet deployment is intentionally omitted by owner direction.
- Recipient wallet-control proofs on the intended network: pending.
- Independent smart-contract audit: pending.
- Deterministic deploy/transaction builder: pending.
- Testnet deployment: intentionally omitted by owner direction; no Testnet transaction has been broadcast.

This runbook is an execution control document, not evidence that any token has been deployed or transferred.
