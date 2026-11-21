# V COIN–TON — Five-Wallet Non-Spending Control Proof

**Document ID:** VCT-SEC-TONPROOF-005  
**Version:** 1.0.0  
**Prepared:** 2026-11-21  
**Scope:** Independent V COIN–TON project only. The legacy BNB project is excluded.  
**Status:** Specification prepared; live dApp integration and wallet proof execution pending.

## 1. Purpose and safety boundary

Implement one reusable TON Connect `ton_proof` flow to verify that the Founder can produce a valid, non-spending signature for each of the five registered TON Mainnet owner addresses.

This is an off-chain identity/control proof. It must not construct, request, sign, or broadcast a TON transfer, Jetton transfer, deployment message, or any other on-chain transaction. It must never request or receive a recovery phrase, private key, PIN, keystore export, or secret QR material.

A successful proof demonstrates control of the signing key corresponding to the verified wallet address at the proof time. It does not by itself prove legal ownership, future exclusive custody, or that no other person has a copy of a key.

## 2. Fixed Mainnet allowlist

The verifier must accept only these exact registered owner addresses and roles. Do not accept arbitrary addresses for this Founder-control workflow.

| Role | Mainnet owner address |
|---|---|
| Founder | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` |
| Treasury | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` |
| Mining reserve | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` |
| Liquidity / market | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` |
| Ecosystem / marketing | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` |

Expected TON Connect network ID: `-239` (Mainnet). Testnet ID `-3` must be rejected for this release gate. Testnet wallets must never be substituted for these five Mainnet addresses.

## 3. User flow

1. The dApp displays the five named roles and their registered address suffixes. It starts with Founder only.
2. The backend creates a cryptographically random, single-use nonce for the current login attempt and role, with a maximum lifetime of 10 minutes.
3. The frontend requests a TON Connect connection with both `ton_addr` (network `-239`) and `ton_proof` using that nonce.
4. The wallet may show an off-chain identity confirmation. The UI must clearly state: “Sign in / Verify wallet control — no blockchain transaction and no network fee.”
5. The backend receives the proof and verifies it against the selected role's exact allowlisted address.
6. Only after the Founder proof succeeds may the Founder initiate the next role. Each role gets a different nonce and independent proof record.
7. A wallet response that omits `ton_proof` or returns a connect-item error is recorded as unsupported/not proven. Never downgrade to a transfer, zero-value transaction, or address-only declaration.

The app must not imply that all five wallets were verified merely because the Founder wallet passed.

## 4. Required backend verification

The verifier must implement the TON Connect Address Proof Signature (`ton_proof`) specification and fail closed unless every check succeeds:

- The challenge is random (at least 32 bytes), server-issued, bound to the role, expected address, browser login attempt, and dApp origin, expires within 10 minutes, and is consumed atomically once.
- The proof timestamp is within the accepted time window.
- The proof domain exactly equals the configured production HTTPS dApp hostname; `lengthBytes` equals the UTF-8 byte length.
- The account network is exactly `-239`.
- The normalized connected account address exactly matches the fixed address for the selected role.
- Parse `walletStateInit`, derive the wallet contract address from it, and require it to equal the connected account address.
- Resolve the signing public key from the validated wallet StateInit using a reviewed wallet-code/version parser. If a supported wallet requires an on-chain `get_public_key` fallback, use it only after validating the active wallet code and address. Never trust the client-supplied `publicKey` field by itself.
- Reconstruct the exact TON Connect proof message bytes and verify the Ed25519 signature with the derived/validated public key and correct network signature domain.
- Reject unsupported wallet code, malformed StateInit, unknown domain, stale timestamp, mismatched address/network/role, reused nonce, and invalid signature.
- Use constant-time comparisons where applicable and return generic failure responses that do not leak verifier internals.

The backend must not store wallet private keys or gain signing/broadcast capability.

## 5. Session, storage, and deployment requirements

- Use a server-side login-attempt/session binding with Secure, HttpOnly, SameSite cookies in production. Rotate the session identifier after successful authentication.
- Store challenge state in a durable shared store (PostgreSQL or an approved atomic cache) for production; an in-memory-only challenge store is acceptable only for local tests and must be labelled non-production.
- Enforce same-origin requests, an exact allowlist for the production dApp origin, TLS/HTTPS, request-size limits, and per-IP/per-session rate limits.
- Store only the minimum audit record: role, normalized address, network, proof timestamp, domain, verification result, verifier version, and a non-secret challenge identifier/hash. Do not store mnemonic/private key/PIN or unnecessary raw wallet payloads.
- Do not create a public endpoint that can be used to assert an arbitrary address as Founder-controlled.
- No proof endpoint may call `sendTransaction`, deploy a contract, transfer Jettons, or trigger a payout.

## 6. Gram Wallet compatibility gate

The Gram Wallet must be tested through the real TON Connect flow. The absence of a visible “Sign Message” menu item does not establish whether it supports the `ton_proof` connect item.

If Gram Wallet returns a successful `ton_proof`, verify it using the backend rules above. If it returns a connect-item error or omits the proof, mark Gram Wallet as unsupported for this proof flow and stop; do not claim success or use a transaction as a substitute. Any alternative wallet must be selected and approved by the Founder.

## 7. Implementation dependencies and blockers

Before a live proof can be requested:

1. Select and control a production HTTPS hostname for the V COIN dApp.
2. Publish a valid TON Connect manifest at that hostname, with the same exact domain used by the verifier.
3. Add the TON Connect frontend integration and backend nonce/verification routes to the existing backend at `contracts/mining/backend`.
4. Add reviewed wallet StateInit public-key extraction for supported wallet code versions and tests for malformed/forged inputs.
5. Add persistent one-time challenge/session storage and automated tests.
6. Run local tests and CI. Then test Founder first, followed by the other four wallets.

The repository currently has a backend API but no confirmed production dApp hostname/manifest or browser wallet-connect UI. Therefore this document is a specification, not a claim that a working proof service or live Gram Wallet integration already exists.

## 8. Evidence and completion criteria

For each role record one of:

- `verified`: a valid Mainnet `ton_proof` signature was cryptographically checked and all address/domain/network/nonce/StateInit checks passed.
- `unsupported`: the wallet did not return a usable `ton_proof`.
- `mismatch`: address, role, network, domain, StateInit, or signature check failed.
- `pending`: no proof has been completed.

The five-wallet gate is complete only when all five independent role records are `verified`. Address text matching alone is recorded separately as `address_match_observed`, never as cryptographic control proof.

No Mainnet deployment, mint, transfer, allocation, or other transaction is authorized by this proof process.
