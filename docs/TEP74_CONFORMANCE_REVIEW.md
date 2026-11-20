# V COIN – TON Jetton Interface Review

**Review date:** 2026-11-21  
**Scope:** Source-level interface comparison for `contracts/jetton/src/messages.tact` and `contracts/jetton/src/jetton.tact`  
**Reference:** [TON TEP-74 – Fungible tokens (Jettons) standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)  
**Status:** Source-level review recorded; not an independent security audit or full certification.

## Findings corrected

1. **Required response destinations:** TEP-74 defines `response_destination:MsgAddress` for `transfer` and `burn`; its suggested internal-transfer and burn-notification layouts also use a required address. The previous source represented these fields as optional. They are now non-optional `Address` fields in the Tact message definitions.
2. **Excesses routing:** The master now sends burn excesses to the required burn response destination. The receiving wallet sends remaining transfer TON to the required response destination whenever a positive remainder exists.
3. **Transfer authorization:** The sender wallet checks that the inbound transfer is signed by its configured owner.
4. **Balance protection:** Transfers and burns require a positive amount and sufficient wallet balance.
5. **Internal transfer authenticity:** A wallet receiving an internal transfer verifies that the sender is either its master or the deterministic Jetton wallet for the declared previous owner.
6. **Burn authenticity:** The master verifies that a burn notification originates from the deterministic Jetton wallet for the declared sender before reducing total supply.
7. **Notifications:** A transfer notification is emitted only when `forward_ton_amount > 0`; the request's query ID, sender, amount and forward payload are propagated.
8. **Wallet derivation and getters:** The master exposes `get_jetton_data` and `get_wallet_address`; the wallet exposes `get_wallet_data`.

## Current test evidence

GitHub Actions run #173 completed successfully:
- Tact build: passed.
- Jest/Sandbox: 18 tests passed.
- Dependency audit: 0 known vulnerabilities.
- `npm ci`: passed using the generated lockfile.
- Run: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44836046070

The committed `contracts/jetton/package-lock.json` was added immediately after that run. A subsequent CI run against the commit containing the lockfile is still required.

## Remaining review and release gates

- Test explicit bounce/recovery behavior for failed destination-wallet delivery and failed burn notification; do not infer these cases from source handlers alone.
- Complete replay/idempotency analysis and additional adversarial transaction tests.
- Compare every TEP-74 message bit layout, getter stack order, storage/gas assumptions and wallet derivation against the official reference implementation.
- Complete TEP-64 metadata validation, including the final approved icon. The current off-chain JSON provides name, symbol, description and six decimals, but intentionally has no image field.
- Implement and test the approved four-year founder vesting/escrow arrangement before any founder allocation is transferred.
- Obtain wallet-control proofs for all five intended destinations on the chosen network.
- Obtain an independent smart-contract security audit of the exact source and compiled code hashes.
- Deploy and verify on Testnet before any Mainnet deployment.
- Add and review a deterministic deployment/transaction-building workflow; all wallet transactions must remain subject to founder inspection and signature.

## Conclusion

The required-address mismatch was corrected and the current source builds and passes the expanded 18-test suite. This document is a source-level conformance checklist, not proof of complete TEP-74/TEP-64 compliance, independent security, Testnet deployment, or Mainnet readiness.
