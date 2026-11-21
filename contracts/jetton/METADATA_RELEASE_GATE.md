# VCOIN Mainnet Metadata Release Gate

**Status: BLOCKED — final production URI and canonical logo are not approved.**

## Existing repository evidence

The repository contains `contracts/jetton/metadata.json` with:
- name: V COIN
- symbol: VCOIN
- decimals: 6
- project description and no-profit-guarantee wording

It does **not** contain an `image` field or the canonical V COIN logo asset. The prior template referenced this historical immutable GitHub URL:

`https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/49c462124a082ef6c850079b35c6f77c5bda6ea2/contracts/jetton/metadata.json`

That URL is not approved for production: it points to metadata without the canonical logo. It must not be used to generate the production Mainnet StateInit.

## Required final metadata

The Founder must approve:
1. The exact final TEP-64 JSON fields and public description.
2. The canonical V COIN logo image asset and its public HTTPS image URI.
3. A durable, immutable/pinned HTTPS URL for the final JSON (for example, a content-addressed IPFS gateway URL or a version-pinned repository URL).
4. Public retrieval of both JSON and image, correct MIME types, and stable content hashes.

The final JSON should include at least `name`, `symbol`, `description`, `decimals`, and `image`. The final metadata JSON hash and image hash must be recorded in the release manifest. Do not silently substitute a placeholder, mutable URL, or the historical URI.

## Safety and generation gate

- `contracts/jetton/deployment.config.template.json` intentionally has `metadata.uri = null` and `metadata.image_uri = null` until explicit approval.
- The historical Founder vesting/escrow configuration has been removed from the deployment template; it conflicts with the current Founder Authority Charter.
- Do not run the production artifact generator until the final URI and canonical logo are approved and pinned.
- Once approved, run the offline generator twice from the exact reviewed source commit, compare all outputs, and independently verify the resulting Master address and StateInit.
- This gate does not authorize deployment, signing, minting, or transfer.
