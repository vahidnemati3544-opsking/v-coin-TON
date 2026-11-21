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

Latest PR-head CI evidence (2026-11-21):
- GitHub Actions run #214 on current PR head `1ff1dbaddc5c6cc365a14ea1a7d4ed738a7ba9ca`: build-and-test completed successfully with 27 tests passing, `npm ci` successful, and zero npm audit vulnerabilities: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44877153157.
- Earlier GitHub Actions run #196 on commit `aa0391a09bc03f690367a53e7cae43f9030528ef`: build-and-test completed successfully.
- The committed `contracts/jetton/package-lock.json` is present on the PR branch; the successful PR-head workflow includes the repository's install/build/test/audit pipeline.
- Earlier full test evidence: run #191 passed 25 tests, build, `npm ci`, and npm audit with zero known vulnerabilities.
- Run #196: https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/44837742976

CI success is evidence for the checked commit and configured tests only. It is not an independent security audit, complete protocol certification, or deployment verification.

## Vesting-specific security limitation

The founder vesting contract restores its `released` counter if the outgoing message to the escrow Jetton wallet itself bounces. For a later downstream delivery bounce, the custom VCOIN Jetton wallet restores its token balance and emits `JettonTransferBounce` to its wallet owner. The founder vesting contract accepts this callback only from its configured escrow Jetton wallet and subtracts the bounced amount from `released`, rejecting invalid amounts and forged senders. Dedicated Sandbox tests cover authenticated rollback and forged-callback rejection. The natural TVM downstream-bounce path and complete balance/counter invariants still require end-to-end verification; do not deploy or fund until those tests and independent review pass.

## Remaining review and release gates

- Run a natural end-to-end TVM bounce test for failed destination-wallet delivery, verify the source wallet restores its token balance and callback reaches vesting, and test failed burn-notification recovery; do not infer these cases from isolated callback tests.
- Complete replay/idempotency analysis and additional adversarial transaction tests.
- Compare every TEP-74 message bit layout, getter stack order, storage/gas assumptions and wallet derivation against the official reference implementation.
- Complete TEP-64 metadata validation, including the final approved icon. The current off-chain JSON provides name, symbol, description and six decimals, but intentionally has no image field.
- Founder vesting source, daily-linear schedule, authenticated downstream-bounce callback and callback Sandbox tests are implemented. The natural downstream TVM bounce path and full balance/counter invariants remain a release gate.
- Obtain wallet-control proofs for all five intended destinations on the chosen network.
- Obtain an independent smart-contract security audit of the exact source and compiled code hashes.
- Respect the owner's direction to omit Testnet deployment; this does not waive reproducible builds, adversarial Sandbox tests, independent audit, wallet-control proofs, or explicit founder approval before Mainnet.
- Add and review a deterministic deployment/transaction-building workflow; all wallet transactions must remain subject to founder inspection and signature.

## Conclusion

The required-address mismatch was corrected and the source has passed the CI runs recorded above. Founder vesting source and callback tests exist; the custom owner callback now reconciles a bounced downstream transfer. Natural TVM bounce-path verification, full invariants and independent review still block deployment/funding. This document is a source-level checklist, not proof of complete TEP-74/TEP-64 compliance, independent security, or Mainnet readiness.
