# V COIN — Jetton Implementation Toolchain Decision

**Document ID:** VCT-TOOLCHAIN-001  
**Version:** 1.0.0  
**Status:** Toolchain selected; implementation and compiler verification pending

## Decision

Use TON's current Tolk language and official Acton Jetton v2.1 Tolk contract baseline for the VCOIN Jetton Master and Wallet. The official TON Jetton creation guide documents the Acton Jetton template, Tolk contract files, and build/test commands. The archived Tact Jetton repository is not the implementation baseline.

## Windows development path

The project owner uses Windows 10. The official TON guide supports Windows through WSL where available, and also documents a manual Windows path using the standalone Tolk compiler package @ton/tolk-js. Before source implementation, confirm the available Node.js version and install/pin the compiler and TypeScript tooling in the project. Never put wallet seed phrases or private keys in the repository.

## Required source baseline

- Official upstream: https://github.com/ton-blockchain/acton-contracts
- Jetton source directory: jetton-v2.1/contracts
- Upstream source commit must be pinned before copying or adapting source.
- Preserve TEP-74 wallet transfer, burn, bounce, and getter behavior.
- Adapt the Master so initial issuance is capped at exactly 10^16 base units, allocations total exactly 10^16 base units, and mint authority is irreversibly disabled after the one-time allocation procedure.
- Remove or permanently disable post-issuance admin minting, code upgrades, metadata mutation, and any other authority that could change token behavior or supply.
- Implement founder vesting as a separately reviewed on-chain lock, with activation timestamp set only at official mining activation.

## Mandatory build and test gates

1. Pin exact compiler and upstream source commit.
2. Compile Master and Wallet reproducibly on Windows or WSL.
3. Run official Jetton conformance tests and VCOIN-specific adversarial tests.
4. Test exact five-bucket issuance and permanent mint disablement.
5. Test TEP-74 transfers, wallet derivation, bounce recovery, burns and malformed messages.
6. Test founder vesting month boundaries and exact tranche totals.
7. Review compiled code and transaction traces independently.
8. Only then prepare a Testnet deployment package; deployment still requires separate explicit approval.

## Important limitation

The upstream reference Master includes privileged mint/admin and code-upgrade capabilities. It must not be deployed unchanged for VCOIN. The VCOIN-specific changes must be reviewed and compiled before any deployment. Merely copying official reference code is not proof of compliance with the approved fixed-supply policy.

## Source references

- https://docs.ton.org/contracts/standard/tokens/jettons/create
- https://github.com/ton-blockchain/acton-contracts/tree/master/jetton-v2.1
- https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md