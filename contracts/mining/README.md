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

### Legacy internal-balance reward model — not approved for public extraction

The legacy engine currently calculates 1% per 24 hours from the user's eligible available internal VCOIN balance at every level 1–400. This model is retained for isolated unit/integration tests only. It is superseded for public extraction by the owner-approved rule below, which requires verified on-chain Jetton wallet balance snapshots.

With six token decimals, calculations use integer base units:
- Daily reward: eligible balance / 100.
- Hourly equivalent: eligible balance / 2,400.
- General accrual: eligible balance × elapsed milliseconds / 8,640,000,000.

The USD interpretation is 1% of the account's VCOIN value per day. Since the same VCOIN market price values both the balance and the reward, the price cancels when converting the rule back into VCOIN units. Therefore no hard-coded USD price or unverified price feed is used by the reward engine. If the VCOIN price changes, the user's USD balance value and the USD value of the reward change proportionally, while the token reward remains 1% of the eligible token balance per 24 hours.

The legacy engine snapshots the internal eligible balance at session start and after each successful claim. Rewards are credited only to the internal accounting balance; this is not an on-chain holding or payout. Do not expose this engine as live extraction. The 1,050,000,000 VCOIN reserve remains a hard cap.

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

The PostgreSQL reserve migration defines a fixed allocation of 1,050,000,000 VCOIN (1,050,000,000,000,000 base units at six decimals). New rewards are reserved in the same transaction as reward creation. The reserve is a hard cap and does not authorize token minting.

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
- Local TON Sandbox integration and wallet-state simulations must be validated. No Testnet deployment or transaction is authorized.

11. Development Status

Implemented in code: deterministic balance-based 1% daily reward calculation, session balance snapshots, reserve enforcement, internal ledger settlement, authenticated API status estimates, and unit tests for the reward formula. Database migration and full CI/local PostgreSQL verification remain required.

Pending: approved 400-level rates/costs, local PostgreSQL verification, complete Telegram Mini App onboarding, additional abuse controls, wallet signature verification, and TON Mainnet wallet-balance adapter design and local Sandbox verification.

The system is not production-ready. Internal mining credits are not on-chain tokens and do not authorize Mainnet deployment or public reward distribution.

---

Project: V COIN – TON
Module: Mining Engine
Network: The Open Network (TON)
Status: Under Development


## Owner-approved wallet-balance rule (2026-11-18)

The source of truth for the next mining interval is the user's **verified on-chain VCOIN Jetton balance in the linked Telegram TON wallet**, not the internal PostgreSQL mining balance. The reward remains 1% per 24 hours at every level from 1 to 400.

The current engine still uses the internal `balances.available_base_units` field and credits rewards back to that internal balance. It is therefore not yet compliant with the approved wallet-balance rule and must not be used for owner extraction. See `docs/WALLET_BALANCE_MINING_SPEC.md` for the required wallet proof, Jetton master validation, immutable balance snapshot, pending reward, confirmed payout, anti-double-counting, and fail-closed rules.

Wallet balance reader, ownership proof, Jetton payout, and on-chain reconciliation are not implemented/verified by the current code. Keep extraction disabled until these components and their local Sandbox/integration tests pass, followed by independent security review and explicit Founder approval for Mainnet.


**Safety gate:** The public `/api/v1/mining` endpoints currently return HTTP 503 (`WALLET_BALANCE_MINING_NOT_IMPLEMENTED`). The previous internal-balance engine is not exposed as an extraction API. This guard must remain until the verified TON wallet-balance implementation and payout reconciliation have passed local Sandbox and isolated integration tests. Testnet deployment and transactions are not authorized.
