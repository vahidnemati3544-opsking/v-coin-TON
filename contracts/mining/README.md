V COIN – TON Mining Engine

1. Purpose

The Mining Engine is a core component of the independent V COIN ecosystem on The Open Network (TON).

Its purpose is to provide a transparent, secure, scalable and auditable system for user participation, reward calculation, level progression and mining accounting.

2. Core Architecture

The Mining Engine consists of the following components:

- User Mining Accounts
- Mining Rate Calculation Engine
- Reward Calculation Engine
- Level Progression Engine
- Reward Distribution Manager
- Mining Reserve Management
- Anti-Fraud and Abuse Detection
- Transaction and Event Ledger
- Administrative Monitoring and Reporting

3. Mining Mechanism

The system must support:

- Individual user mining sessions
- Accurate time-based reward calculations
- Dynamic mining rates
- Level-based mining power
- Reward calculation with defined precision
- Prevention of duplicate reward generation
- Verifiable mining history

Mining calculations must be deterministic and auditable.

### Owner-approved USD-value reward formula (2026-11-18)

The daily mining reward is **1% of the user's eligible VCOIN wallet balance value in USD**, accrued over 24 hours. The rule is identical at every level from 1 through 400. The level number does not multiply, reduce, or otherwise change the 1% daily rate.

Definitions:
- `B`: verified eligible VCOIN Jetton wallet balance, in VCOIN.
- `P`: the approved VCOIN USD reference price for the same valuation snapshot.
- `V_USD = B * P`: eligible account value in USD.
- `R_USD = V_USD * 0.01`: daily reward value in USD.
- `R_VCOIN = R_USD / P`: daily reward amount in VCOIN.

Because the same VCOIN price snapshot is used to value the eligible VCOIN balance and convert its reward, the price cancels algebraically: **`R_VCOIN = B * 0.01` for a full 24-hour interval**. The USD-value formula is the business rule; the equivalent integer-base-unit formula is used by the engine.

For six-decimal VCOIN precision, calculate with integer base units and round down:
- Full-day reward: `floor(snapshot_base_units / 100)`.
- Partial interval: `floor(snapshot_base_units * elapsed_ms / 8,640,000,000)`.
- The maximum accrual interval and missed-claim policy remain subject to the separately approved operational policy.

Illustrative examples only, using a reference price of USD 0.004 per VCOIN:
| Eligible account value | Daily reward value | Daily VCOIN reward |
|---:|---:|---:|
| USD 215 | USD 2.15 | 537.5 VCOIN |
| USD 235 | USD 2.35 | 587.5 VCOIN |
| USD 260 | USD 2.60 | 650 VCOIN |
| USD 315 | USD 3.15 | 787.5 VCOIN |
| USD 420 | USD 4.20 | 1,050 VCOIN |

The USD 0.004 figure above is an illustration, not a guaranteed market price, exchange quote, or promise of value. A modelled reference price must never be represented as a live market price.

Eligibility and accrual controls:
- The source of truth is the user's **verified on-chain VCOIN Jetton balance** in the linked TON wallet, not an internal PostgreSQL balance or a client-entered USD amount.
- Wallet ownership, TON network, approved VCOIN Jetton master, owner address, decimals, source freshness, and chain context must be verified before a snapshot is eligible.
- A snapshot is immutable for its accrual interval. Deposits arriving during an interval apply to the next interval and are not rewarded retroactively.
- Pending internal mining rewards do not count toward the next interval. A reward becomes eligible only after its VCOIN transfer is confirmed on-chain and a fresh wallet snapshot includes it. This prevents double counting.
- Reserved balances are excluded. All rewards are subject to the hard 5,000,000,000 VCOIN mining reserve; this rule does not authorize minting.
- If the wallet proof, chain data, Jetton identity, or balance freshness cannot be verified, mining must fail closed. Never fall back to an internal balance.

4. Level Progression System

The level system is designed to support:

- User level management
- Upgrade requirements
- Upgrade cost calculation
- Mining power adjustments
- Upgrade transaction verification
- Complete upgrade history

The final level structure and economic parameters must be approved before implementation.

5. Reward Accounting

The system must maintain separate accounting records for:

- Purchased V COIN
- Extracted V COIN
- Confirmed rewards
- Pending rewards
- Distributed rewards
- Available and restricted balances

Every reward operation must have a unique identifier and an auditable record.

6. Mining Reserve

The PostgreSQL reserve migration defines a fixed allocation of 5,000,000,000 VCOIN (5,000,000,000,000,000 base units at six decimals). New rewards are reserved in the same transaction as reward creation. The reserve is a hard cap and does not authorize token minting.

The settlement migration confirms a reserved reward and posts balanced ledger entries to the mining expense and user's internal VCOIN liability accounts, then updates the user's internal balance in the same transaction. This is an application-accounting credit, not a TON wallet transfer.

7. Anti-Fraud and Security

The Mining Engine must protect against:

- Automated account abuse
- Duplicate reward claims
- Manipulated timestamps
- Unauthorized balance modifications
- Multi-account reward abuse
- Invalid level upgrades
- Replay attacks
- Unauthorized administrative operations

All sensitive operations must be logged and independently verifiable.

8. TON Integration

The engine must be designed for native integration with TON.

It must support:

- TON wallet connectivity
- TON transaction verification
- Smart contract integration
- Secure backend communication
- Reliable synchronization with blockchain events

Internal mining records must remain distinguishable from confirmed on-chain transactions.

9. Performance and Scalability

The architecture must support:

- Large numbers of concurrent users
- Reliable reward processing
- Idempotent operations
- Database consistency
- Fault recovery
- Monitoring and audit capabilities

10. Development and Testing

Before production:

- Mining formulas must be formally specified.
- Economic parameters must be approved.
- Reward calculations must be tested.
- Security tests must be completed.
- Distribution limits must be verified.
- TON testnet integration must be validated.

11. Development Status

Implemented as internal-only code: deterministic 1% daily balance-reward arithmetic, session balance snapshots, mining-reserve reservation, and double-entry internal-ledger settlement. These components currently operate on PostgreSQL internal balances; they are not the approved verified TON-wallet-balance extraction system. The mining router exists for isolated tests but is not mounted on the public server. Public `/api/v1/mining` requests deliberately return HTTP 503. Unit tests are present, but successful execution and PostgreSQL integration have not yet been verified.

Pending: verified TON wallet ownership proof and Jetton balance reader, immutable on-chain snapshots, payout and finality reconciliation, approved 400-level upgrade costs/rates, local PostgreSQL migration and integration verification, complete Telegram Mini App onboarding, additional abuse controls, and TON Testnet extraction rehearsal.

The system is not production-ready. Internal mining credits are not on-chain tokens and do not authorize Mainnet deployment or public reward distribution.

---

Project: V COIN – TON
Module: Mining Engine
Network: The Open Network (TON)
Status: Under Development


## Owner-approved wallet-balance rule (2026-11-18)

The source of truth for the next mining interval is the user's **verified on-chain VCOIN Jetton balance in the linked Telegram TON wallet**, not the internal PostgreSQL mining balance. The reward remains 1% per 24 hours at every level from 1 to 400.

The current engine still uses the internal `balances.available_base_units` field and credits rewards back to that internal balance. It is therefore not yet compliant with the approved wallet-balance rule and must not be used for owner extraction. See `docs/WALLET_BALANCE_MINING_SPEC.md` for the required wallet proof, Jetton master validation, immutable balance snapshot, pending reward, confirmed payout, anti-double-counting, and fail-closed rules.

Wallet balance reader, ownership proof, Jetton payout, and on-chain reconciliation are not implemented/verified by the current code. Keep extraction disabled until these components and their TON Testnet integration tests pass.


**Safety gate:** The public `/api/v1/mining` endpoints currently return HTTP 503 (`WALLET_BALANCE_MINING_NOT_IMPLEMENTED`). The previous internal-balance engine is not exposed as an extraction API. This guard must remain until the verified TON wallet-balance implementation and payout reconciliation have passed tests.
