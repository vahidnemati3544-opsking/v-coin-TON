# V COIN Mainnet Issuer

This static TonConnect console is designed to request Founder-controlled wallet signatures only.

- The deployment action requires the registered Founder wallet on TON Mainnet; this same address serves the GAS & OPERATIONS role.
- It submits one message with the predicted Master StateInit, VCoinFund body, and 0.75 TON minimum attached value.
- The five mint actions require the registered Founder wallet and are sent one at a time as separate wallet-signing requests. The next action unlocks only after the Founder manually confirms the prior on-chain transaction and recipient Jetton Wallet balance.
- The UI does not collect or store private keys, seed phrases, PINs, or recovery phrases.
- The UI does not claim on-chain finality; after each signature, verify the transaction and account state on Mainnet before continuing.
- The allocation amounts and recipient addresses are loaded from the CI-generated deployment-preview.json.

The page is published through GitHub Pages. If Pages is not yet enabled, the verification workflow attempts to enable it with the repository's Actions permissions.

The formerly configured inaccessible GAS wallet is retired and must not be funded or used. Founder and GAS & OPERATIONS are one address and do not create a sixth VCOIN allocation.

The deployment button locks after a signing request is returned to avoid duplicate requests in the same page session. Reloading the page does not prove a transaction failed; always check Mainnet before retrying.
