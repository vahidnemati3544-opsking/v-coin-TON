# V COIN Mainnet Issuer

This static TonConnect console is a Founder-controlled interface for reviewing and requesting signatures for the V COIN TON Jetton the five-stage Founder-first initial receipt, followed by the four Founder-signed allocation transfers.

## Build and deployment

- GitHub Actions compiles the current Jetton source, generates the unsigned Mainnet preview, copies that exact preview into the Pages artifact, and deploys the artifact.
- `issuer/deployment-preview.json` is a CI-generated release input and is intentionally not maintained as a stale checked-in preview.
- The issuer reads the deployment attachment from the CI-generated `unsigned_deploy_message.attached_ton` field and converts it to nanotons at runtime; it does not hard-code a reserve amount. The current generated preview requests **1.00 TON**. This is a reserve amount, not a live fee quote. The Founder must review the current wallet/network fee estimate before signing.
- Each of the five allocation requests is a separate Founder-signed message with **0.01 TON** attached, plus any live network fee required by the wallet/network.
- The five allocation amounts and destination owner addresses are loaded from the CI-generated preview tied to the exact source commit.

## GitHub Pages requirement

- The repository's Pages site must first be enabled by the repository owner/admin in **Settings → Pages**, with **Source = GitHub Actions**.
- The workflow deploys to an existing Pages site. The Actions-generated `GITHUB_TOKEN` cannot create a missing Pages site because that operation requires additional administration permission.
- No personal access token or repository-administration secret is stored in this project.

## Signing and safety

- The deployment and all five allocations require the registered Founder wallet on TON Mainnet; the same wallet serves as GAS & OPERATIONS. No separate fee wallet or sixth allocation destination exists.
- Allocation messages are sent one at a time. The next action unlocks only after the Founder manually confirms the prior on-chain transaction and recipient Jetton Wallet balance.
- The UI does not collect or store private keys, seed phrases, PINs, or recovery phrases.
- The UI does not claim on-chain finality. After each signature, independently verify the transaction, Master state, total supply, allocation flag, and recipient Jetton Wallet balance on Mainnet before continuing.
- The current preview is explicitly unsigned. Publishing this interface does not deploy or issue VCOIN.

