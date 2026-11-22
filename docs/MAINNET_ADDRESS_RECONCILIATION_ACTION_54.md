# V COIN–TON Exact-Head Artifact and Master Address Reconciliation — Action #54

**Review date:** 2026-11-23  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`  
**Branch:** `main`  
**Reviewed HEAD:** `d6c4f1cdd5618aa0eaa7b7ab31e58a998cb00bbe`  
**Latest exact-head CI run:** [#282 / 45066224453](https://github.com/vahidnemati3544-opsking/v-coin-TON/actions/runs/45066224453)  
**Disposition:** Source/build/Pages checks passed; the user-supplied historical Master address is reconciled to an earlier unsigned preview; on-chain deployment status remains unverified and Mainnet remains NO-GO.

## 1. Exact current repository and artifact evidence

The installed GitHub connection has repository admin/push permissions. The latest default-branch HEAD is `d6c4f1cdd5618aa0eaa7b7ab31e58a998cb00bbe`.

Run #282 on that exact HEAD completed successfully:
- `build-and-test`: success.
- Dependency lockfile install and audit enforcement: success.
- Tact compilation: success.
- TEP-64 metadata content-cell generation: success.
- Unsigned Mainnet deployment preview generation: success.
- Jest Sandbox suite: success.
- TonConnect issuer syntax and transaction-sequencing guards: success.
- Full source snapshot upload: success.
- GitHub Pages deployment: success.
- Published endpoint verification step: success.

Artifacts from run #282:
- Full source artifact ID `14771790593`, size 476,280 bytes, SHA-256 `482b913daeda2a4c482c08ca47c3748a40befbe32eebb1dd1ec7d256d12beb0d`.
- Contract release artifact ID `14771606988`, size 173,080 bytes, SHA-256 `fbeebdd60c32d4269951c06130882b999c7a501f3b991818f6712b192426a8c8`.
- GitHub Pages artifact ID `14771512236`, SHA-256 `234db5685bc0b790f9557c1d8c441c409e14e4571fa4c880528eebd2342e6a45`.

The local `VCOIN-TON-FULL-SOURCE-FINAL.zip` and its duplicate `VCOIN-TON-FULL-SOURCE-FINAL_2.zip` both match the latest full-source artifact digest exactly. The local `VCOIN-TON-MAINNET-RELEASE-PREVIEW.zip` matches the latest contract release artifact digest exactly. The older combined source/release ZIP is from the earlier Action #53 snapshot and is not the newest full-source snapshot.

## 2. The user-supplied address is an earlier predicted Master address

User-provided public address:
`UQAo1TAGqSw6oUaMmpBtgQyRtCGEbSJNiGGy2Use04lRCVSR`

The address decodes to workchain 0 and account ID:
`28d53006a92c3aa1468c9a906d810c91b421846d224d8861b2d94b1ed3895109`

That account ID exactly matches the StateInit hash and predicted Master account in the earlier unsigned release artifact `VCOIN-TON-MAINNET-UNSIGNED-22534f7d.zip`:
- Earlier predicted Master: `EQAo1TAGqSw6oUaMmpBtgQyRtCGEbSJNiGGy2Use04lRCQlU`
- Earlier StateInit hash: `28d53006a92c3aa1468c9a906d810c91b421846d224d8861b2d94b1ed3895109`
- Earlier metadata content-cell hash: `6dc0e0c3a9ec89e72fc8402a13915bb425032a0e57dfa955ba5579eab28c940c`

The `UQ` and `EQ` forms above carry the same account ID; they are different user-friendly flag/checksum representations of the same account, not two different Master accounts.

**Important:** This establishes that the supplied address corresponds to the earlier predicted StateInit. It does not establish that the address was deployed or that a transaction succeeded.

## 3. Latest source produces a different Master address

The latest exact-head preview in artifact `14771606988` is tied to source commit `d6c4f1cdd5618aa0eaa7b7ab31e58a998cb00bbe` and reports:
- Status: `unsigned_mainnet_deployment_preview_only`
- Network: `mainnet`
- Predicted Master: `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP`
- StateInit hash: `67e215bc6ca8454d2cfdae2639ab73ebdd27c99afd9560a65097f35631b2befb`
- Master code-cell hash: `5087c882019324e9d8e309c78f42e3bcee9433a54d7d0367d49320a7bbabcc36`
- Master data-cell hash: `241c4f33ce0b692788ea1e397953f923447ec3dc40bce20ad402a68de7b9fb37`
- Metadata content-cell hash: `abadcbc42c4e6309bea1d595dbfd1b834a07bfb171b2b1e2cb6d4b7e244330ca`
- Initial Master funding attachment in the unsigned preview: 1.00 TON; this is not a live network fee quote.

The contract code-cell hash is unchanged from the earlier preview, but the metadata content and Master data/StateInit hashes changed after the canonical logo metadata was integrated. Consequently, the latest predicted Master address differs from the earlier address. The two predicted addresses must never be interchanged.

The current metadata URI is pinned to commit `e17bcb9d82ea182bff3358b9fac6b5fa25c166ee`; fetching that exact raw file confirms it contains the TEP-64 image URI. The canonical image bytes are JPEG (JFIF signature) and the repository filename is now correctly `.jpg`; the rename preserved the original bytes. The current Pages workflow copied the logo into the Pages artifact and verified required published endpoints successfully.

## 4. Transaction hash supplied earlier

The supplied 32-byte Base64 hash:
`e7f/73oWAIrr1PSEsbZOEUr/k4oml1FpKf+R3gI2Xhk=`

Hex:
`7bb7ffef7a16008aebd4f484b1b64e114aff938a2697516929ff91de02365e19`

A 32-byte value can be a transaction hash or a message hash. It was not found in the current repository search or the reviewed ZIP text. Without a successful Mainnet explorer/API lookup and the associated account/transaction context, it cannot be assigned to the earlier or latest Master. TON's explorer guidance explains that wallet submission may return a message hash; when necessary, message lookup is used to locate the resulting transaction.

## 5. Mandatory on-chain reconciliation before any new deployment or issuance

The chain state for both addresses must be queried on TON Mainnet:
1. Earlier address: `UQAo1TAGqSw6oUaMmpBtgQyRtCGEbSJNiGGy2Use04lRCVSR`.
2. Latest preview address: `EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP`.

For each, verify account status, deployed code hash, current data/state, last transaction, and Master getters (`get_jetton_data`, `get_wallet_address`). If the earlier address is active, do not deploy the latest preview as a second VCOIN Master; first compare its live code/data/getters with the intended supply, owner, metadata, and five wallet destinations. If neither address is active, the latest preview remains only a candidate and still requires all release gates.

The transaction hash must be looked up as both a possible message hash and, if applicable, a transaction hash. For a transaction, confirm account, logical time, inbound message, compute/action success, outgoing messages, bounce state and finality. A wallet returning from a signing flow is not proof of on-chain success.

## 6. Remaining blockers and safety decision

Mainnet remains **NO-GO** pending:
- Successful live Mainnet lookup of the earlier address and latest preview address.
- Successful resolution of the supplied hash to a message/transaction trace.
- Independent qualified TEP-74/TEP-64 smart-contract audit.
- Independent clean-room rebuild and hash reproduction of the exact intended source/artifact.
- Live fee/reserve review for the exact payload.
- Founder review and personal signature for deployment and each separate allocation, only after all gates pass.

No Mainnet transaction was submitted by this review. No Testnet deployment or transaction is authorized. Public mining remains fail-closed (HTTP 503) until verified Jetton wallet ownership, fresh on-chain balance snapshots, payout finality and reconciliation are implemented.

## 7. Action #54 change log

This is an evidence/reconciliation addendum. It deliberately does not replace either Master address with the other, does not change contract source or metadata, and does not trigger a deployment. The next implementation task is the read-only Mainnet state/transaction lookup, followed by an explicit decision whether the historical address is already deployed and must remain the canonical Master.

## 8. Publication and repository write record

Action #54 was committed directly to `main` in three documentation-only commits:
- Reconciliation report: `6376d96fab5a40bb3af951a9a3d6a6c420d0e136`.
- Verification-status superseding addendum: `3ba8d3017151d7fca27ae3194b250b707adb1de0`.
- Deployment-inventory addendum: `b8ab15d1b758f3e3cbca5daed123ee5ba8deaab3`.

The resulting branch HEAD is `b8ab15d1b758f3e3cbca5daed123ee5ba8deaab3`. These commits change documentation only; the contract/issuer source remains the exact source snapshot tested by run #282 at `d6c4f1cdd5618aa0eaa7b7ab31e58a998cb00bbe`. No code or deployment artifact was silently changed by Action #54.
