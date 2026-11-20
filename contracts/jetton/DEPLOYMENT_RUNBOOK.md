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

### Gate B — Testnet
- Verify founder wallet proof on Testnet.
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
- GitHub Actions run #155: build passed; 13 Sandbox/policy tests passed; dependency audit reported zero vulnerabilities after pinned transitive overrides. Run: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44826842894
- Test evidence is limited to the current CI Sandbox suite; it is not a full TEP-74/TEP-64 conformance audit or independent smart-contract audit.
- Dependency versions are constrained by package.json overrides, but a committed package-lock.json is still outstanding for fully reproducible installs.
- Independent smart-contract audit: pending.
- Testnet deployment and on-chain verification: pending.
- TEP-64 metadata URI/content: not finalized; deployment config still has metadata URI unset.
- Founder four-year vesting/escrow implementation: pending.
- Recipient wallet-control proofs on the intended network: pending.

This runbook is an execution control document, not evidence that any token has been deployed or transferred.
