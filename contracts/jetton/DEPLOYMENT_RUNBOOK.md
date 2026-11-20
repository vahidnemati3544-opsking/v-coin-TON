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

## 3A. Approved vesting requirements (implementation gate)

The founder has approved these linear vesting schedules. Approval records the policy. The escrow implementation has now been added to the draft security branch, but it is not yet merged, audited, deployed, or evidence that any tokens are currently locked.

| Allocation | Amount | Duration | Cliff | Accrual |
|---|---:|---:|---:|---|
| Founder | 2,000,000,000 VCOIN | 4 years (1,461 days / 126,230,400 seconds) | None | Linear, continuously accrued; daily display may be used |
| Mining reserve | 5,000,000,000 VCOIN | 24 months (730 days / 63,072,000 seconds) | None | Linear, continuously accrued; daily display may be used |

Vested amount at time t is calculated in integer base units:
`vested = allocation × min(max(t - start_time, 0), duration) / duration`.
All arithmetic must use checked integer operations; rounding remainder is released only at full vest completion.

Required custody behavior:
- Mint founder and mining allocations only to two separate deterministic `VcoinVestingEscrow` instances created by the minter. The draft implementation derives each escrow address from the minter address, escrow code, vesting kind, and approved start time; direct minting to either beneficiary wallet is rejected.
- The minter must be deployed with `adminAddress` equal to the recorded Founder wallet because it authorizes the one-time start-time configuration. The escrow code independently fixes the release controller to the Founder wallet; no admin unlock or controller substitution exists.
- The founder is the sole authorized signer/controller for release transactions, but the escrow contract must enforce the time-based vested ceiling. Founder authorization must not bypass the lock.
- The mining reserve escrow may release only vested amounts to the recorded mining-reserve destination; any subsequent movement remains subject to founder-controlled wallet keys.
- No admin backdoor, arbitrary unlock, beneficiary substitution, or emergency withdrawal may bypass the schedule.
- The draft escrow implements one-time deployment readiness acknowledgements, one-time exact deposits, integer linear vesting, monotonic release query IDs, beneficiary-wallet success acknowledgement, failed-transfer recovery, and no admin unlock or beneficiary substitution. The current verified draft revision passes Acton build, 87 emulator tests across 9 files, static checks, formatting, and a local-emulated run of the guarded minter deployment script. Deeper adversarial tests and independent review remain mandatory.
- Start timestamps and escrow addresses remain unset until explicitly approved and verified on-chain.

**Hard stop:** the escrow code and minter integration exist only on the unmerged Draft security branch. The current CI suite passes, but do not merge, deploy, or mint until the exact deployment configuration is reviewed, an independent smart-contract audit is complete, and Testnet deployment plus end-to-end wallet verification succeeds. Founder and mining allocations must never be minted directly to beneficiary wallets. Mainnet remains unauthorized.

## 4. Deployment sequence

### Gate A — source and build
- Import the maintained official Jetton reference implementation at a pinned commit.
- Apply the fixed-supply and one-time-issuance constraints.
- Review Jetton master and wallet behavior against TEP-74 and metadata against TEP-64.
- Build reproducibly; record compiler/toolchain versions and code hashes.
- Run unit, sandbox, negative, replay, authorization, transfer, burn, supply-cap, escrow deployment, exact deposit, and vesting-release tests.
- Generate and inspect current VCOIN minter and vesting escrow wrappers from the pinned Acton toolchain.

### Gate B — Testnet
- The guarded first-stage deployment script is `contracts/acton/scripts/deploy-vcoin-minter.tolk`. It constructs the VCOIN minter with zero initial supply, the recorded allocation wallets, six-decimal metadata, and the Founder wallet as immutable initial admin. In broadcast mode it stops unless the connected wallet equals the recorded Founder address.
- First run locally from `contracts/acton`: `acton script scripts/deploy-vcoin-minter.tolk`. This must complete without broadcasting.
- After the Founder has reviewed the exact script revision and approved Testnet gas spending, connect either the Founder Tonkeeper wallet or the separate GAS & OPERATIONS wallet through TON Connect and run: `acton script scripts/deploy-vcoin-minter.tolk --net testnet --tonconnect`. This sends a real Testnet deployment transaction and spends Testnet TON; it is not a Mainnet deployment.
- Record the confirmed master address and transaction hash from the script output, then verify the deployed getter state and code on a Testnet explorer.
- Verify control of the chosen Testnet payer wallet and verify the recorded Founder admin address independently. A successful deployment does not prove control of all five allocation wallets.
- Deploy master and verify get_jetton_data.
- Verify wallet address derivation and wallet code.
- Mint exactly the approved initial supply once.
- Attempt a second mint and prove it fails.
- Transfer small test amounts to separate wallets; verify notifications, balances, fees, and transaction finality.
- Verify metadata and explorer presentation.
- Record all addresses, transaction hashes, code hashes, and test outputs.

### Gate C — Mainnet approval
- Complete independent smart-contract review.
- Review token distribution, consumer disclosures, sanctions/AML obligations, tax and securities/financial-services considerations with qualified counsel in relevant jurisdictions.
- Confirm all recipient addresses and custody/vesting arrangements.
- Confirm TON for deployment and transfer fees.
- Obtain explicit founder approval of the final build hashes, metadata, supply, and destinations.

### Gate D — Mainnet deployment and distribution
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
- Jetton master address: not deployed.
- Deployment transaction: none.
- Initial mint transaction: none.
- Mainnet allocation transfers: none.
- Draft escrow implementation: present in PR #4 security branch; deterministic dual escrow deployment and founder/mining deposit acknowledgement covered by emulator tests. The guarded minter deployment script has passed local emulation. Dedicated end-to-end successful-release, replay, and bounce/retry tests, independent audit, and Testnet verification remain pending.
- Latest verified Acton CI before the latest payer-guard adjustment: 87 tests passed in 9 files; build, wrapper generation, local deployment-script exercise, static checks, and formatting passed. The payer-guard adjustment is undergoing CI now. The first-stage Testnet deployment script is ready for an owner-approved TON Connect run; no Testnet broadcast has been made.
- Independent audit: not yet completed.

This runbook is an execution control document, not evidence that any token has been deployed or transferred.
