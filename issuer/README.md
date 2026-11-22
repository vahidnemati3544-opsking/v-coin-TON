# V COIN Mainnet Issuer

This static TonConnect console is designed to request Founder-controlled wallet signatures only.

- The deployment action requires the registered GAS & OPERATIONS wallet on TON Mainnet.
- It submits one message with the predicted Master StateInit, VCoinFund body, and 0.75 TON minimum attached value.
- The five mint actions require the registered Founder wallet and are sent as five separate wallet-signing requests.
- The UI does not collect or store private keys, seed phrases, PINs, or recovery phrases.
- The UI does not claim on-chain finality; after each signature, verify the transaction and account state on Mainnet before continuing.
- The allocation amounts and recipient addresses are loaded from the CI-generated deployment-preview.json.

The page is published through GitHub Pages. If Pages is not yet enabled, the verification workflow attempts to enable it with the repository's Actions permissions.
