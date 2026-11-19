# V COIN — One-Time Genesis Issuance Design

**Document ID:** VCT-GEN-001  
**Version:** 1.0.0  
**Status:** Implementation decision; code and emulator tests still required  
**Scope:** V-Coin-TON only

## 1. Non-negotiable invariants

- Decimals: 6.
- Maximum and intended initial supply: exactly 10,000,000,000,000,000 base units.
- Allocation buckets, in base units:
  - Founder vesting contract: 2,000,000,000,000,000
  - Mining reserve: 5,000,000,000,000,000
  - Treasury: 1,000,000,000,000,000
  - Liquidity/market: 1,000,000,000,000,000
  - Ecosystem/marketing: 1,000,000,000,000,000
- Sum must equal the exact cap before any deployable state can be produced.
- No public or owner-callable arbitrary mint method.
- No metadata mutation, code upgrade, confiscation, or arbitrary balance editing.
- Mining, purchase settlement, founder vesting releases, and Mainnet deployment remain disabled pending their separate gates and approvals.

## 2. Why the vendored reference minter cannot be deployed

The pinned Acton reference minter currently accepts admin mint, admin changes, metadata mutation, and code-upgrade messages. These are incompatible with the approved fixed-supply policy. Removing only the admin key is not enough: the initial allocation must still be distributed correctly to standard Jetton wallets, and the total supply must equal the sum of actual wallet balances.

A Jetton wallet address is derived from its code and initial data. Its standard initial data includes a zero balance. Precomputing a wallet address using a non-zero balance would produce a different address and break standard wallet-address derivation. Therefore, the implementation must deploy or initialize the canonical zero-balance wallet and credit it through a correctly authenticated Master-originated internal-transfer message.

## 3. Chosen implementation pattern: five-slot one-time genesis controller

The VCOIN Master must be built from the pinned Tolk/Acton Jetton baseline but must not retain the reference admin interface.

Its deployment state must contain:
- The immutable metadata cell and Jetton Wallet code.
- The exact 10^16 base-unit supply cap.
- Five immutable allocation records, each containing a fixed recipient address, exact base-unit amount, and an initially-unclaimed flag.
- A fixed genesis coordinator address (not a general-purpose admin).
- A genesis-completion state.

The only issuance operation is a dedicated genesis-allocation message. The Master must accept it only when:
1. The sender is exactly the fixed genesis coordinator.
2. The slot identifier is one of the five defined slots.
3. The slot has not already been claimed.
4. The requested amount exactly equals that slot's immutable allocation.
5. The recipient exactly equals that slot's immutable destination.
6. The sum of completed and pending allocations cannot exceed the fixed supply cap.

The Master then deploys or addresses the recipient's canonical Jetton Wallet using the standard zero-balance StateInit and sends an authenticated internal-transfer message for the exact slot amount. A slot must not be marked complete until the wallet credit is confirmed by a safe, replay-resistant acknowledgement protocol. A bounced credit must restore accounting and leave the slot retryable. Repeated requests for an already completed slot must fail without changing supply or balances.

After all five slots are completed:
- The sum of the five completed amounts must equal exactly 10^16 base units.
- Genesis authority is irreversibly disabled.
- The contract reports mintable = false.
- No code path can re-enable genesis or minting.
- No upgrade or metadata mutation path exists.

The coordinator is a narrowly scoped one-time dispatcher, not an owner wallet with arbitrary mint authority. It must be separately reviewed and must only submit the five precommitted slot messages. If the final implementation cannot prove that the coordinator cannot alter recipients, amounts, or slot order, the coordinator pattern must not be used.

## 4. Failure and accounting model

- Use explicit slot states: unclaimed, pending, completed.
- Use unique query IDs and bind acknowledgements to the slot, recipient, amount, and deployment instance.
- Do not count pending transfers as completed allocation.
- On bounce, restore the slot to retryable state and reverse any provisional supply accounting exactly once.
- Prevent replay of both allocation requests and acknowledgements.
- Expose getters for cap, completed supply, each slot status, recipient and amount, and genesis completion.
- At every stable state, completed allocation sum must equal Master totalSupply and must not exceed the cap.
- The five recipient wallet balances must sum to the exact cap when genesis is complete.
- Burning reduces totalSupply; burned tokens never replenish a genesis slot or mining reserve.

## 5. Founder allocation

The founder slot recipient is the separately audited founder vesting contract, not the founder beneficiary wallet. The vesting contract must hold the full 2,000,000,000 VCOIN allocation and enforce 48 monthly calendar-based tranches. Its clock must remain unset until the official Mainnet mining-activation transaction is separately authorized and recorded. Testnet rehearsal timestamps must never be reusable as Mainnet activation state.

## 6. Deployment and verification sequence

1. Validate all five addresses privately, confirm control and network, and construct an untracked deployment manifest. Never commit actual addresses, mnemonics, private keys, or USD holdings.
2. Compile Master, Wallet, genesis coordinator, and founder vesting contracts with the pinned Acton toolchain.
3. Run emulator tests for each slot, duplicate/replay, wrong sender, wrong recipient, wrong amount, malformed message, failed wallet deployment, bounced transfer, and retry.
4. Assert the exact allocation sum and actual Jetton Wallet balances after all five slots.
5. Assert mintable=false, no privileged mutation opcodes, and no upgrade entry point.
6. Run transfer, burn, bounce, excesses, and TEP-74 interoperability tests.
7. Obtain independent security review.
8. Rehearse on Testnet with test-only addresses and test-only supply.
9. Verify Master and all five allocation Jetton Wallet addresses and balances from independent TON data sources.
10. Mainnet deployment and any real token movement require a separate explicit owner approval of the exact transaction preview.

## 7. Current gate

This document is a design decision, not a completed contract. The vendored reference minter remains unsafe for VCOIN deployment until the new Master, coordinator, wallet integration, vesting contract, tests, and independent review are complete. Do not deploy the reference minter. Mining and payout activation remain OFF.
