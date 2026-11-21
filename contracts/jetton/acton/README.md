# V COIN Jetton — TON Testnet

Based on TON Blockchain's official `acton-contracts/jetton-v2.1`, pinned to upstream commit `d721c3179696b453a9490fcfd2f30770f8c234b4`.
Source: https://github.com/ton-blockchain/acton-contracts/tree/d721c3179696b453a9490fcfd2f30770f8c234b4/jetton-v2.1

## Security controls
- TEP-74 Jetton Master and Wallet; upstream Jetton v2.1 patterns.
- Six decimals; hard on-chain cap of 10,000,000,000 VCOIN = 10^16 base units.
- Master accepts mint, burn notification, wallet discovery, TON top-up and irreversible admin-drop messages only.
- Admin transfer, metadata mutation and code-upgrade messages are not accepted by the VCOIN Master.
- After the exact initial issuance, admin must be dropped. The hard cap applies even before admin drop.
- TESTNET ONLY. Testnet tokens are for technical rehearsal and have no real value.

## Build and tests
Install Acton 1.2.0 or later using the official TON guide:
https://docs.ton.org/contracts/standard/tokens/jettons/create

From this directory:
```sh
acton run generate-wrappers
acton build
acton test tests
```
Do not deploy if any command fails. GitHub Actions runs these checks too.

## Testnet sequence
1. Use a dedicated TON Testnet wallet. Never connect a Mainnet wallet for this rehearsal.
2. Deploy the Master with zero initial supply:
   `acton script scripts/deploy.tolk --net testnet --tonconnect`
3. Record the Master address and verify it on a Testnet explorer.
4. Mint exactly 10,000,000,000 VCOIN (10^16 base units) to the selected Testnet wallet:
   `JETTON_MINT_AMOUNT=10000000000000000 acton script scripts/mint.tolk --net testnet --tonconnect`
5. Irreversibly drop minter admin:
   `acton script scripts/drop-admin.tolk --net testnet --tonconnect`
6. Inspect the Master and verify total supply = 10000000000000000, mintable = false, admin = null, decimals = 6, and the owner's Jetton Wallet balance = 10000000000000000:
   `acton script scripts/info.tolk --net testnet`
7. Only after on-chain verification, record the exact Testnet Master address and deployment transaction in the manifest.

The wallet owner personally approves each Testnet transaction. Never share seed phrases or private keys.

## Mainnet gate
No Mainnet deployment is authorized. Allocation destination addresses, founder vesting parameters, final metadata image URL, custody design, independent audit and separate explicit approval are still required.


## Windows 10 development note

Acton currently targets Linux and macOS. On Windows 10, use an Ubuntu WSL2 environment with Node.js 22+ and the official Acton installer. Run the build and test commands inside WSL from this folder. The Testnet deployment commands require a funded Testnet wallet and explicit wallet approval; do not put recovery phrases or private keys in shell commands or environment variables.


## CI release gate
A release candidate is blocked unless the Acton wrapper generation, contract compilation, and emulator test workflow completes successfully. Testnet deployment is a separate, manually wallet-approved step.
