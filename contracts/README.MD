# V COIN – TON Smart Contracts

## Purpose
This directory contains the smart contract source code and technical specifications for the V COIN ecosystem on The Open Network (TON).

## Development Scope
- TON-native token implementation
- Token supply and distribution controls
- Mining reward contract architecture
- Level upgrade and payment mechanisms
- Secure transaction processing
- Contract testing and audit preparation

## Security Requirements
- No unauthorized minting
- Strict access control
- Protection against replay and duplicate transactions
- Transparent transaction accounting
- Independent security review before deployment

## Development Rules
- Use TON-compatible smart contract languages and tools.
- Keep source code modular and documented.
- Test all contracts on a test network before production.
- Never deploy unreviewed code to TON Mainnet.

## Current Status

- Architecture and deployment controls are documented.
- Founder authority and allocation policy are recorded in `docs/FOUNDER_CONTROL_AND_ALLOCATION.md`.
- Deployment and custody procedure is recorded in `contracts/jetton/DEPLOYMENT_RUNBOOK.md`.
- Allocation manifest template is available at `contracts/jetton/allocation-manifest.template.json`.
- The repository currently contains no verified Jetton master/wallet source package or reproducible contract build. Do not treat the documentation/config template as a deployable token.
- No Testnet or Mainnet deployment, initial issuance, or allocation transfer has been verified.

No production deployment is authorized until the official reference implementation is pinned, fixed-supply controls are implemented and tested, and independent review is complete.
