# V COIN–TON Jetton Deployment Inventory

**Document ID:** VCT-JETTON-INV-001  
**Reviewed:** 2026-11-18  
**Scope:** `vahidnemati3544-opsking/v-coin-TON` only  
**Result:** **UNVERIFIED — do not enable wallet mining or payouts.**

## Findings

1. The repository's architecture documents describe a future TON Jetton (TEP-74), but architecture text is not a deployable contract or proof of deployment.
2. The reviewed repository paths include `contracts/mining/engine.js` and `contracts/mining/backend/`; no Jetton master/wallet source, compiled contract artifact, deployment script, deployment manifest, or verified VCOIN master address was identified in the inspected paths.
3. Repository code search is not indexed for this repository, so empty code-search results cannot be treated as proof that no additional file exists.
4. The public mining API is fail-closed. It returns HTTP 503 with `WALLET_BALANCE_MINING_NOT_IMPLEMENTED`.
5. No verified on-chain evidence was available in this audit to establish that VCOIN Jetton has been deployed on either TON Testnet or Mainnet.

## What is required to establish deployment

- Identify the intended network explicitly (Testnet for the first rehearsal).
- Obtain the VCOIN Jetton master address from the deployment transaction/owner-controlled deployment record.
- Verify the address on the matching TON network explorer.
- Call/read the Jetton master's `get_jetton_data()` and verify total supply, mintability, admin address, metadata and wallet code against the approved design.
- Verify `get_wallet_address(owner)` and the resulting owner's Jetton wallet `get_wallet_data()`, including owner and master fields.
- Compare the on-chain supply/decimals and allocation records with the approved tokenomics; investigate any mismatch.
- Record the master address, network, deployment transaction and verification evidence in this repository only after verification.

## Safety rules

- Never substitute a generic Jetton, USDT master, example token or a per-user Jetton wallet address for the VCOIN master.
- Token name, ticker, logo and metadata alone do not authenticate a Jetton.
- Do not deploy to Mainnet, mint, transfer real-value assets or activate mining as part of this inventory task.
- Never ask for or store wallet seed phrases/private keys. Wallet signing stays in the wallet interface.
- Until the master and network are verified, wallet-balance mining and payouts remain blocked.

## Official technical reference

TON's Jetton architecture uses one master contract and a separate Jetton wallet contract per owner. The TEP-74 interface includes `get_jetton_data()`, `get_wallet_address(owner)` and `get_wallet_data()`. Verification must bind the owner's Jetton wallet to the approved master address; metadata is not identity proof.
