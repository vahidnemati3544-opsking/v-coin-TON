# Gram Wallet / WalletTg — TON Connect Proof Compatibility

**Document ID:** VCT-SEC-GRAM-PROOF-001  
**Version:** 1.0.0  
**Prepared:** 2026-11-22  
**Scope:** Independent V COIN–TON project only. The legacy BNB project is excluded.  
**Status:** Official protocol path confirmed; live app/version compatibility and Founder proof remain pending.

## 1. Finding

TON's official documentation identifies WalletTg (also called tg-wallet / Telegram Wallet) as the wallet contract used by Telegram's native Gram wallet. WalletTg supports dApp connections through TON Connect. TON's WalletTg integration guidance explicitly describes support for TON Connect ton_proof.

This confirms a documented technical route for Gram Wallet. It does **not** prove that the exact installed Gram Wallet build on the Founder's phone will return a successful ton_proof; that must be tested through a real dApp connection.

Official references:
- https://docs.ton.org/contracts/standard/wallets/telegram/overview
- https://docs.ton.org/contracts/standard/wallets/telegram/integrate
- https://docs.ton.org/applications/ton-connect/how-to/ton-proof
- https://github.com/ton-blockchain/ton-connect/blob/main/spec/connect.md

## 2. WalletTg-specific verifier requirements

A generic fixed-key wallet parser is not sufficient for WalletTg. The backend must:

1. Parse the supplied wallet StateInit and require its code hash to match the reviewed WalletTg trampoline code hash: 9149ae51c1e4689710cebf7830297b16acfbadb363a920a537893e7ffeeca768.
2. Derive the wallet address from StateInit and require an exact match with the connected account address.
3. Query the live account on TON Mainnet and require an active account whose code matches the same WalletTg trampoline hash.
4. Call get_public_key() on that validated active WalletTg account and use the returned current signing public key for Ed25519 proof verification.
5. If TON Connect supplies publicKey, require it to match the validated current getter result. Never trust a client-supplied public key by itself.
6. Require a fresh proof after a wallet key rotation; an existing TON Connect session must be disconnected and reconnected.
7. Reject inactive accounts, code mismatches, failed getter calls, malformed StateInit, wrong address, wrong domain, wrong network, expired/replayed nonce, or invalid signature.

The StateInit anchor key may be stale after key rotation. Do not use it as the current WalletTg signing key when rotation may have occurred.

## 3. Founder-first test procedure

- Use only the Founder Mainnet address registered in docs/TON_CONNECT_FIVE_WALLET_PROOF.md.
- Request only ton_addr for network -239 and ton_proof.
- Show a clear wallet prompt explaining that this is an off-chain control proof, not a blockchain transaction and not a transfer.
- If Gram returns a successful proof item, send it to the backend verifier and accept it only after every WalletTg-specific check above passes.
- If Gram returns a ton_proof item error (including METHOD_NOT_SUPPORTED) or omits the proof, record the result as unsupported/pending. Do not substitute a zero-value transfer, transaction, or address-only declaration.
- Do not proceed to the other four wallets until the Founder proof is cryptographically verified.

## 4. Security and governance boundary

This flow must never request or store a recovery phrase, private key, PIN, or secret QR material. The backend must have no wallet signing or transaction-broadcast capability. No transaction, deployment, mint, or transfer is authorized by this document.

A successful proof establishes control of the relevant signing key at proof time. It does not establish legal ownership or prove that no other party has access to a copy of the key.

## 5. Current blockers

- A neutral production HTTPS domain has not yet been registered or configured.
- A production TON Connect manifest has not yet been published under that domain.
- The live frontend connect flow and backend challenge/verifier are not yet implemented or deployed.
- The exact Gram Wallet app build on the Founder's phone has not yet been tested.
- No cryptographic Founder proof has been received or verified.

**Release status remains HOLD / NO-GO.**


## 6. Important distinction — standalone Gram Wallet app vs Telegram's native WalletTg

The Founder reports using the standalone Android app named **Gram Wallet**, version **26.11.1**, not a wallet opened inside Telegram.

Do not infer that this standalone app uses the WalletTg contract merely because TON documentation describes WalletTg for Telegram's native wallet. These are distinct product/runtime claims and must be verified separately.

The current TON Connect wallet registry lists the standalone app under `gramwallet`, with its own universal URL (`https://connect.gramwallet.io`), Android support, and declared `SendTransaction` and `SignData` features. The registry entry inspected for this review does not declare a `ton_proof` feature. This absence is not conclusive proof that the app cannot return `ton_proof`, but it means support is **not confirmed** by the registry.

Therefore:
- Do not apply the WalletTg trampoline hash or `get_public_key()` fallback to the standalone Gram Wallet unless its live account StateInit is proven to be WalletTg and its active code hash passes the exact check.
- First test the standalone app's actual TON Connect response using a production-ready, approved HTTPS dApp origin and a non-spending request for `ton_addr` plus `ton_proof`.
- If the app returns a proof item error, omits `ton_proof`, or cannot complete the connection, record standalone Gram Wallet 26.11.1 as unsupported/unverified for this proof flow. Do not replace proof with `SignData`, address-only matching, or a transaction.
- A separate wallet with documented `ton_proof` support may be evaluated only as an alternative after the Founder chooses it; do not silently switch wallets.

Official evidence reviewed:
- TON Connect wallet registry: https://github.com/ton-connect/wallets-list/blob/main/wallets-v2.json
- TON `ton_proof` verification guide: https://docs.ton.org/applications/ton-connect/how-to/ton-proof
- TON WalletTg integration guide: https://docs.ton.org/contracts/standard/wallets/telegram/integrate

**Revised compatibility conclusion:** TON Connect connection support for standalone Gram Wallet is listed; `ton_proof` support for the installed standalone build is not established. WalletTg protocol support must not be treated as proof that this separate app implements WalletTg.
