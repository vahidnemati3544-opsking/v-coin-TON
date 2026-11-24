# Owner Action #69 — Five-stage Founder-first VCOIN receipt

**Date:** 2026-11-24  
**Status:** Merged to main; exact-head Jetton, Backend, and Mining/PostgreSQL CI passed. Mainnet remains HOLD / NO-GO.

## Controlling Founder instruction

The full fixed supply of **2,100,000,000 VCOIN** (6 decimals; 2,100,000,000,000,000 base units) is initially received only by the registered Founder Mainnet wallet:

UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT

| Stage | VCOIN | Base units |
|---:|---:|---:|
| 1 | 420,000,000 | 420000000000000 |
| 2 | 1,050,000,000 | 1050000000000000 |
| 3 | 210,000,000 | 210000000000000 |
| 4 | 210,000,000 | 210000000000000 |
| 5 | 210,000,000 | 210000000000000 |
| **Total** | **2,100,000,000** | **2100000000000000** |

Each stage is a separate Founder-signed request. The next stage is blocked until the preceding Founder Jetton-wallet credit is acknowledged. No amount can be changed, skipped, duplicated, or minted above the fixed cap. Stage 5 acknowledgement permanently disables minting.

## Final allocation after full Founder receipt

- Founder retains 420,000,000 VCOIN.
- Mining Reserve: 1,050,000,000 VCOIN.
- Treasury: 210,000,000 VCOIN.
- Liquidity / Market: 210,000,000 VCOIN.
- Ecosystem / Marketing: 210,000,000 VCOIN.

The Founder personally signs four ordinary TEP-74 transfers after all five receipt stages have completed. These are transfers of already-issued VCOIN, not additional minting.

## Engineering implementation

- Master contract: exact five-stage sequence, exact stage amounts, one pending stage at a time, hard supply cap, idempotent wallet acknowledgements, and stage-specific bounce rollback.
- Founder Jetton wallet: stores the last receipt acknowledgement and permits owner-triggered resend; duplicate acknowledgements cannot advance twice.
- Sandbox tests: all five stages, exact supply, out-of-order/wrong amount rejection, acknowledgement retry, Stage 1/2 natural bounce rollback, and four post-receipt distributions.
- PostgreSQL reconciliation: records five exact finalized receipt events in order; prevents any distribution before all five are confirmed; enforces four exact destinations and amounts.
- Testnet tool: five unsigned Testnet-only request previews; no signing or broadcast. Mainnet planner remains disabled pending independent verification and separate Founder release authorization.
- CI: exact-head compilation, Sandbox, backend, migration, and Testnet preview gates must pass before merge.

## Safety and authorization

- Mainnet deployment, gas funding, receipt, and subsequent transfers are not authorized by this engineering instruction.
- deployment_authorized=false and mainnet_authorized=false remain enforced.
- No private key, recovery phrase, PIN, or seed phrase is requested or stored.
- Historical Testnet wallet UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy is Testnet-only and must never be used on Mainnet.
- PR #21's two-stage 1B + 1.1B plan is superseded. It must not be merged or used as a release plan.
