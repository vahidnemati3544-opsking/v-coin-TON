# V COIN–TON On-Chain Allocation Enforcement

**Document ID:** VCT-ALLOC-ENF-001  
**Checkpoint:** 2026-11-21  
**Scope:** Tact Jetton candidate in Draft PR #6; no changes to the BNB project.  
**Status:** Stage 1 implemented and CI-verified; escrow-recipient enforcement and release controls remain incomplete. Not deployed and not authorized for transactions.

## 1. Finding confirmed in source

The Tact master in `contracts/jetton/src/vcoin.tact` has now been changed from a single full-supply founder mint to five distinct founder-authorized category issuance messages. It stores five destination owner-addresses configured once before issuance, rejects duplicate destinations and later reconfiguration, and assigns immutable caps: Founder 2B, Mining 5B, Treasury 1B, Liquidity 1B, Ecosystem 1B VCOIN.

Each category can be issued exactly once for its fixed amount. The master tags the outbound Jetton transfer with the category ID; if the destination wallet transaction bounces, the master authenticates the matching category ID and exact amount, restores that category's one-time flag, and rolls back total supply so that only the failed category can be retried. After all five categories have been credited, the master verifies the total is exactly 10B base-adjusted units and permanently disables minting. The old unrestricted full-supply `VCoinMint` entrypoint has been removed.

Important remaining limitation: the five destination addresses are owner-configured and immutable after setup, but this Tact stage does not prove that the Founder and Mining destinations are the intended escrow contract types. Nor does the ordinary Jetton wallet restrict post-issuance transfers by category. The Founder vesting contract remains a separate component; Mining escrow enforcement and strict escrow-only destination validation are not complete. The manifest is not used as a substitute for these on-chain rules.

## 2. Approved economic limits to preserve

All amounts below are whole VCOIN; the contract uses six decimals.

| Category | Cap | Base units | Share |
|---|---:|---:|---:|
| Founder | 2,000,000,000 | 2,000,000,000,000,000 | 20% |
| Mining reserve | 5,000,000,000 | 5,000,000,000,000,000 | 50% |
| Treasury | 1,000,000,000 | 1,000,000,000,000,000 | 10% |
| Liquidity / market | 1,000,000,000 | 1,000,000,000,000,000 | 10% |
| Ecosystem / marketing | 1,000,000,000 | 1,000,000,000,000,000 | 10% |
| **Total** | **10,000,000,000** | **10,000,000,000,000,000** | **100%** |

No additional minting is permitted. The founder's four-year vesting schedule and the owner's sole-signature custody policy must remain intact.

## 3. Enforcement architecture required

A real category cap cannot be implemented by adding more numbers to JSON. The issuance path itself must be changed so that the master contract, not an off-chain operator, enforces all five amounts.

Required sequence for a future candidate:

1. Deploy the fixed-supply master with minting disabled until a single initialization/issuance sequence is authorized.
2. Deploy the Founder vesting escrow and Mining reserve escrow against the deployed master. Their deterministic Jetton-wallet addresses must be derived from that master and independently recomputed.
3. Configure the master exactly once with the five approved allocation destinations: the two escrow contracts for Founder and Mining, and the three recorded owner wallets for Treasury, Liquidity/Market, and Ecosystem/Marketing. The configuration must be immutable after acceptance.
4. Require the one-time issuance message to contain exactly the five approved amounts, with their sum equal to 10,000,000,000 × 10^6 base units. Reject missing, duplicate, reordered, altered, or extra allocations.
5. Mint directly to the five configured destinations in the same issuance operation. Do not mint the full supply to the founder's ordinary wallet and rely on later discretionary transfers.
6. Make the issuance state recoverable and idempotent under bounced internal messages. A partial multi-recipient issuance must not permit a second full issuance or leave the master supply inconsistent with recipient balances. This requires explicit pending/confirmed allocation accounting and tests for every bounce position.
7. Keep all later withdrawals from the escrows under founder-only authorization. Founder vesting must continue to pay only its immutable beneficiary; Mining withdrawals must be bounded by the 5B reserve and require founder authorization under the approved custody model.

## 4. Critical design constraints

- The current one-message `mintTo(receiver, amount)` helper is not sufficient for atomic multi-recipient allocation. The master and escrow contracts need an explicit, tested issuance state machine.
- A multi-message issuance is not automatically atomic on TON. If any recipient wallet deployment or internal transfer bounces, the implementation must reconcile the master supply, pending amounts, escrow balances, and retry rights without double-issuing.
- The master address is needed to derive escrow Jetton-wallet addresses. Therefore the deployment/configuration sequence must avoid circular address assumptions: deploy master first, deploy/configure escrows against that master, derive and verify their Jetton-wallet addresses, then configure the master's immutable recipient map and issue.
- The three ordinary wallet destinations are recorded candidates only. Wallet-control proofs on Mainnet remain mandatory before a final transaction package is prepared.
- The separate TON fee wallet is not a VCOIN allocation recipient.
- Do not silently switch to the separate Acton/Tolk candidate. This document applies only to the Tact branch currently under review.
- Never commit seed phrases or private keys. No contract should custody them.

## 5. Mandatory tests before this architecture can be accepted

- Exact five-category allocation succeeds once and totals exactly 10B VCOIN.
- Any changed amount, missing category, duplicate category, wrong destination, or second issuance is rejected.
- Master minting remains disabled after successful issuance.
- Each category's cumulative escrow outflow can never exceed its configured cap.
- Founder escrow starts its 1,460-day daily-linear schedule only after exact authenticated funding and always pays the immutable founder beneficiary.
- Mining escrow cannot release more than 5B VCOIN and cannot be withdrawn without the founder's authorization.
- Natural TON Sandbox bounces are exercised at each issuance hop, including failures of each recipient Jetton wallet in turn.
- Repeated messages, duplicate acknowledgements, forged notifications, forged bounce callbacks, amount mismatches, and stale query IDs cannot increase supply or release counters.
- After every success and failure path, master total supply equals the sum of all Jetton wallet balances; pending issuance state and escrow counters reconcile exactly.
- The exact final source passes clean reproducible build, full Sandbox suite, dependency audit, and independent third-party review.

## 6. Release decision

**HOLD.** This document records the required architecture and test gates; it does not claim that per-category on-chain enforcement has already been implemented. The existing master still mints the full supply to the founder wallet, so the current Tact candidate must not be treated as enforcing category caps.

No merge, deployment, mint, transfer, or wallet-signing action is authorized by this document. Testnet deployment remains omitted by owner direction. Mainnet work remains blocked until the architecture is implemented, all tests pass on the exact reviewed commit, an independent audit is complete, wallet control and fees are verified, and the founder separately approves the exact transaction payloads.


## 7. Implementation checkpoint — 2026-11-21

### Implemented in Draft PR #6

- Replaced the full-supply-to-founder mint path with five fixed category caps and five distinct destination owner-addresses configured once before issuance.
- Added owner-only `VCoinConfigureAllocations` and `VCoinMintAllocation` messages. Category IDs are 1–5 in the order Founder, Mining, Treasury, Liquidity, Ecosystem.
- Fixed amounts in six-decimal base units: 2,000,000,000,000,000; 5,000,000,000,000,000; and 1,000,000,000,000,000 for each of the remaining three categories.
- Added per-category issued flags and category-tagged mint transfers. The master disables minting only after all five category flags are set and total supply equals exactly 10,000,000,000,000,000 base units.
- Added bounce rollback: a bounced category transfer must carry the corresponding category ID and exact fixed amount; the master reverses only that category's issued flag and supply amount, reopening that category for retry.
- Updated Sandbox integration tests for exact five-wallet issuance, immutable configuration, non-owner rejection, unknown category rejection, duplicate category rejection, and natural bounced issuance rollback/retry.

### Exact verification evidence

- Draft PR #6 head: `f189e85278cfdb83a0e8c09b7251842513fbd623`.
- Jetton workflow #248 passed on that exact head: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44888388766
- Build passed; all 31 Jest/Sandbox tests passed; `npm ci` passed; `npm audit --audit-level=high` passed with zero known vulnerabilities.
- Earlier workflow #247 passed 30 tests on the immediately preceding head; workflow #248 is the relevant exact-head evidence after adding the natural issuance-bounce test.

### Remaining non-negotiable gaps

1. The configured destination map is immutable after setup but is not yet constrained to verified contract types. Founder and Mining must be routed to the intended escrow contracts, not merely arbitrary owner-supplied addresses.
2. Mining escrow contract, bounded release logic, and founder-only withdrawal controls are not implemented in this Tact candidate.
3. Founder vesting currently has separate code/tests; the issuance integration must be redesigned so the Founder allocation is issued directly to the correct escrow destination and the escrow funding handshake is verified, rather than relying on a discretionary post-issuance transfer.
4. The Jetton wallet remains a standard transferable wallet. Category caps limit the amount originally issued to each destination; they do not freeze tokens or restrict where a destination owner may later transfer them.
5. Natural bounce coverage currently demonstrates a category rollback/retry path for a failed recipient Jetton wallet. A full five-destination adversarial matrix, balance invariant/property testing, independent security audit, Mainnet wallet-control proofs, deterministic deployment payload, and exact founder transaction approval remain pending.

**Decision: HOLD.** This is a real implementation of one-time category issuance caps, not a complete escrow/custody enforcement system and not deployment readiness. PR #6 remains Draft and unmerged. No Mainnet/Testnet deployment, mint, transfer, or wallet signing has occurred.
