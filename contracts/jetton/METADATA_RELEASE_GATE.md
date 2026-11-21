# VCOIN Mainnet Metadata Release Gate

**Status: PUBLISHED TO REVIEW BRANCH — Founder approval and final release verification remain pending.**

## Existing repository evidence

The repository contains `contracts/jetton/metadata.json` with:
- name: V COIN
- symbol: VCOIN
- decimals: 6
- project description and no-profit-guarantee wording

The review branch now contains the canonical logo at `contracts/jetton/assets/vcoin-canonical-logo.png` and the metadata JSON includes an `image` field. The prior template referenced this historical immutable GitHub URL:

`https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/49c462124a082ef6c850079b35c6f77c5bda6ea2/contracts/jetton/metadata.json`

That URL is not approved for production: it points to metadata without the canonical logo. It must not be used to generate the production Mainnet StateInit.

## Published review candidates

- Image URI (pinned to logo commit `eb659d4c17ae8f101a5dd0146f2fba3147288b4d`):
  `https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/eb659d4c17ae8f101a5dd0146f2fba3147288b4d/contracts/jetton/assets/vcoin-canonical-logo.png`
- Metadata URI (pinned to metadata commit `dffeb3a6da82f3f3b05f8309b8e104aafb3c3e72`):
  `https://raw.githubusercontent.com/vahidnemati3544-opsking/v-coin-TON/dffeb3a6da82f3f3b05f8309b8e104aafb3c3e72/contracts/jetton/metadata.json`
- Metadata blob SHA: `15ce6b1d02828f8fcf5c5e34ecfc312c0080f087`
- Logo Git blob SHA: `87a3e78313d26e36e500802e158827486bbc34c6`

Before production use, the Founder must approve the exact JSON fields/description and visual logo, and public retrieval, MIME types, and stable content hashes must be independently checked.

The current review JSON includes `name`, `symbol`, `description`, `decimals`, and `image`. Do not silently substitute a placeholder, mutable URL, or the historical URI. These pinned GitHub URLs are review candidates and are not, by themselves, Founder approval or a production release.

## Safety and generation gate

- `contracts/jetton/deployment.config.template.json` intentionally has `metadata.uri = null` and `metadata.image_uri = null` until explicit approval.
- The historical Founder vesting/escrow configuration has been removed from the deployment template; it conflicts with the current Founder Authority Charter.
- Do not run the production artifact generator until the final URI and canonical logo are approved and pinned.
- Once approved, run the offline generator twice from the exact reviewed source commit, compare all outputs, and independently verify the resulting Master address and StateInit.
- This gate does not authorize deployment, signing, minting, or transfer.
