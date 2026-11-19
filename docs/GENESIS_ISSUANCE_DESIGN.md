# V COIN — One-Time Genesis Issuance Design

**Document ID:** VCT-GEN-001  
**Version:** 1.1.0  
**Status:** Implementation design; Master, wallet handshake and emulator tests still required  
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

## 3. One-time five-slot genesis controller

The VCOIN Master must be built from the pinned Tolk/Acton Jetton baseline but must not retain the reference admin interface.

Its deployment state must contain:
- The immutable metadata cell and VCOIN Jetton Wallet code.
- The exact 10^16 base-unit supply cap.
- Five immutable allocation records, each containing a fixed recipient address, exact base-unit amount, a unique query ID and an initially-unclaimed state.
- A fixed genesis coordinator address (not a general-purpose admin).
- A genesis-completion state and completed-supply counter.

The only issuance operation is a dedicated genesis-slot request. The Master must accept it only when:
1. The sender is exactly the fixed genesis coordinator.
2. The slot identifier is one of the five defined slots.
3. The requested slot maps to its immutable recipient and amount; callers cannot supply or override either.
4. The slot is unclaimed or pending. A pending request may only retry the exact same transfer/query ID.
5. The completed and pending allocation totals cannot exceed the fixed supply cap.
6. The slot query ID is unique to that Master deployment and allocation slot.

The Master deploys or addresses the recipient's canonical zero-balance Jetton Wallet and sends the exact allocation as an authenticated Master-originated internal transfer. It must not mark the slot completed or increase totalSupply until it receives a valid wallet acknowledgement.

After all five slots are completed:
- The sum of the five completed amounts must equal exactly 10^16 base units.
- Genesis authority is irreversibly disabled.
- The contract reports mintable = false.
- No code path can re-enable genesis or minting.
- No upgrade or metadata mutation path exists.

The coordinator is a narrowly scoped one-time dispatcher, not an owner wallet with arbitrary mint authority. It must be separately reviewed and must only submit the five precommitted slot messages. If the final implementation cannot prove that the coordinator cannot alter recipients, amounts, or slot order, the coordinator pattern must not be used.

## 4. Acknowledgement, retry and accounting protocol

The ordinary TEP-74 wallet transfer flow is asynchronous. A Master must not assume that sending an internal-transfer message proves that the recipient wallet credited the Jettons. The VCOIN wallet therefore needs a narrowly scoped genesis acknowledgement extension while retaining ordinary TEP-74 transfer and burn behavior.

- Each VCOIN Jetton Wallet stores a one-time genesis marker: genesis_credited, genesis_query_id, and genesis_amount.
- A genesis credit is accepted only from its configured Master, with transferInitiator = null, a nonzero slot-specific query ID, and a positive amount.
- On the first valid genesis credit, the wallet credits its balance, stores the marker, and sends GenesisCreditAck to the Master, binding query ID, amount and owner address.
- If the exact same genesis query ID and amount is received again, the wallet must not credit its balance again; it only resends the acknowledgement.
- A different genesis query ID or amount after the one-time marker is set must be rejected.
- The Master keeps the slot pending until the acknowledgement arrives. It validates the acknowledgement sender against the deterministic Jetton Wallet address derived from the immutable slot recipient, Master address and wallet code; it also validates owner, query ID and exact amount.
- Only the first valid acknowledgement changes the slot to completed and increments totalSupply. Duplicate acknowledgements are harmless no-ops and cannot increase supply twice.
- If the original Master-to-wallet transfer bounces, the Master returns the pending slot to retryable state without increasing totalSupply.
- If the acknowledgement bounces or is lost, the Master/coordinator may resend the exact same slot request. The wallet's stored marker prevents a duplicate credit and causes the acknowledgement to be sent again.
- Query IDs, slot status transitions and all acknowledgement fields must be replay-resistant and covered by emulator transaction-trace tests.

The implementation must explicitly test the ambiguous asynchronous cases: successful credit with a lost/bounced acknowledgement, repeated request while pending, duplicate acknowledgement, conflicting replay, and failed wallet deployment. If the acknowledgement protocol cannot be proven correct under transaction emulation, genesis issuance is not deployable.

## 5. Failure and accounting model

- Use explicit slot states: unclaimed, pending, completed.
- Do not count pending transfers as completed allocation or as totalSupply.
- On a bounced credit, restore the slot to retryable state exactly once.
- Prevent replay of both allocation requests and acknowledgements.
- Expose getters for cap, completed supply, each slot status, recipient and amount, and genesis completion.
- At every stable state, completed allocation sum must equal Master totalSupply and must not exceed the cap.
- The five recipient Jetton Wallet balances must sum to the exact cap when genesis is complete.
- Burning reduces totalSupply; burned tokens never replenish a genesis slot or mining reserve.

## 6. Founder allocation

The founder slot recipient is the separately audited founder vesting contract, not the founder beneficiary wallet. The founder beneficiary wallet supplied privately by the owner is stored only as the fixed beneficiary inside the vesting contract. The vesting contract must hold the full 2,000,000,000 VCOIN allocation and enforce 48 monthly calendar-based tranches. Its clock must remain unset until the official Mainnet mining-activation transaction is separately authorized and recorded. Testnet rehearsal timestamps must never be reusable as Mainnet activation state.

Because the vesting contract address is derived from its code and initial state, it must be built and independently reviewed before the final five-slot Master deployment configuration is generated. Do not substitute the founder beneficiary wallet as the founder allocation recipient.

## 7. Deployment and verification sequence

1. Validate all five operational destinations privately, confirm control and network, and construct an untracked deployment manifest. The founder allocation destination is the vesting contract address, generated after the vesting code/state is finalized. Never commit actual addresses, mnemonics, private keys, or USD holdings.
2. Compile Master, Wallet, genesis coordinator, and founder vesting contracts with the pinned Acton toolchain.
3. Run emulator tests for each slot, duplicate/replay, wrong sender, wrong recipient, wrong amount, malformed message, failed wallet deployment, bounced transfer, acknowledgement bounce/loss and retry.
4. Assert the exact allocation sum and actual Jetton Wallet balances after all five slots.
5. Assert mintable = false, no privileged mutation opcodes, and no upgrade entry point after genesis.
6. Run transfer, burn, bounce, excesses, and TEP-74 interoperability tests.
7. Obtain independent security review.
8. Rehearse on Testnet with test-only addresses and test-only supply.
9. Verify Master and all five allocation Jetton Wallet addresses and balances from independent TON data sources.
10. Mainnet deployment and any real token movement require a separate explicit owner approval of the exact transaction preview.

## 8. Current gate

This document is an implementation design, not a completed contract. The vendored reference minter remains unsafe for VCOIN deployment until the VCOIN-specific Master, wallet acknowledgement extension, genesis coordinator, founder vesting contract, adversarial tests and independent review are complete. Do not deploy the reference minter. Mining and payout activation remain OFF.
