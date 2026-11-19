# V COIN — Allocation Destination Readiness

**Document ID:** VCT-ALLOC-001  
**Version:** 1.0.0  
**Status:** Owner supplied five destination addresses; format checks passed; wallet ownership and on-chain deployment checks pending  
**Scope:** V-Coin-TON only

## 1. Approved fixed allocation

All amounts use six-decimal Jetton base units. Total initial issuance is exactly 10,000,000,000 VCOIN (10^16 base units).

| Bucket | Share | VCOIN | Base units | Destination treatment |
|---|---:|---:|---:|---|
| Founder | 20% | 2,000,000,000 | 2,000,000,000,000,000 | Audited vesting contract; founder wallet is immutable beneficiary |
| Mining reserve | 50% | 5,000,000,000 | 5,000,000,000,000,000 | Dedicated reserve wallet; mining remains disabled |
| Treasury | 10% | 1,000,000,000 | 1,000,000,000,000,000 | Owner-supplied treasury wallet |
| Liquidity / market | 10% | 1,000,000,000 | 1,000,000,000,000,000 | Owner-supplied liquidity wallet |
| Ecosystem / marketing | 10% | 1,000,000,000 | 1,000,000,000,000,000 | Owner-supplied ecosystem wallet |
| **Total** | **100%** | **10,000,000,000** | **10,000,000,000,000,000** | |

At the reference accounting rate of USD 0.004 per VCOIN, the indicative amounts are USD 8,000,000; USD 20,000,000; and USD 4,000,000 for each of the three 10% buckets, totalling USD 40,000,000. These are private planning figures only, not a market quote, redeemable balance, or guaranteed value.

## 2. Address intake validation

The project owner supplied one TON friendly address for each of the five buckets in the conversation. An offline format check confirmed for all five strings:

- friendly-address decoding succeeded;
- the TON CRC16-XMODEM checksum matched;
- the decoded address is in workchain 0;
- all five strings have the expected 48-character friendly form.

This validates address-string integrity only. It does **not** prove wallet ownership, control of signing keys, deployed account state, network balance, or suitability as a contract destination. No addresses are reproduced in this public repository document.

The founder wallet is the vesting beneficiary, not the direct recipient of unlocked founder allocation at genesis. The 2 billion VCOIN founder allocation must first be held by a separately implemented and independently reviewed on-chain vesting contract.

## 3. Private deployment manifest

Never commit the five actual addresses to this repository. Before a deployment rehearsal, create a local private manifest outside version control and populate these environment variables:

- `VCOIN_FOUNDER_BENEFICIARY_ADDRESS`
- `VCOIN_FOUNDER_VESTING_CONTRACT_ADDRESS`
- `VCOIN_MINING_RESERVE_WALLET_ADDRESS`
- `VCOIN_TREASURY_WALLET_ADDRESS`
- `VCOIN_LIQUIDITY_MARKET_WALLET_ADDRESS`
- `VCOIN_ECOSYSTEM_MARKETING_WALLET_ADDRESS`

The public `deployment.config.template.json` contains only the variable names and null address placeholders. The private manifest must be excluded from Git, CI logs, issue comments, pull requests and public build artifacts. Never place mnemonic phrases or private keys in any manifest or environment file committed to Git.

## 4. Mandatory preflight before any issuance

1. Confirm each address by opening the intended wallet and comparing the complete address character-by-character. Do not rely on a shortened display.
2. Confirm each wallet is controlled by the intended owner and that the selected network is explicit.
3. Deploy and test the final fixed-supply Jetton and vesting contracts on Testnet first.
4. Verify the Master getter, total supply, mintable flag, metadata, deterministic Jetton wallet addresses, and each allocation balance from on-chain state.
5. Confirm the founder vesting contract beneficiary and immutable 48-month schedule. Vesting must not begin at deployment; it begins only on the separately authorized official mining-activation event.
6. Independently review the contract source, compiled artifacts, deployment state-init and transaction plan.
7. Produce a human-readable transaction preview listing network, Master address, each destination, amount, and total before any wallet signature.
8. Obtain a separate explicit approval for the exact Mainnet deployment and issuance transaction. No transaction may be signed or broadcast based solely on this document.

## 5. Operational safety gates

- Intended production network: TON Mainnet.
- Initial rehearsal network: TON Testnet.
- Mainnet deployment and issuance: **NOT AUTHORIZED / NOT EXECUTED**.
- Mining activation and reward payouts: **DISABLED** until the project owner gives a separate explicit command.
- Purchase settlement: **DISABLED** pending verified payment and reserve-payout testing.
- No liquidity provision, market making, exchange listing, or public valuation claim is authorized by this allocation record.

## 6. Current status

The five owner-supplied address strings passed format/checksum validation. The final VCOIN-specific fixed-supply Master, vesting contract, allocation deployment scripts, VCOIN-specific tests, independent security review, and wallet ownership confirmations are still pending. The upstream reference Jetton CI passing does not constitute approval or proof of the final VCOIN contracts.
