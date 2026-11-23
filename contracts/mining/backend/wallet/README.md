Current policy correction (2026-11-23): This file contains historical wallet-integration guidance. Any statement below requiring an independent security audit as an active project task or release gate is superseded and is not part of the approved V COIN–TON workstream. Current allocation baseline is five Mainnet wallets only; Founder is also the sole GAS & OPERATIONS wallet. Mainnet-only execution applies; no Testnet deployment or transaction is authorized. Wallet integration remains subject to local engineering tests and explicit Founder authorization for any Mainnet transaction.

V COIN – TON Wallet Architecture

1. Purpose

The V COIN Wallet is a secure, non-custodial digital wallet designed for the independent V COIN ecosystem on The Open Network (TON).

Its primary purpose is to provide users with secure control over their digital assets, wallet credentials and blockchain transactions.

2. Non-Custodial Architecture

The wallet must follow strict non-custodial principles:

- Users maintain exclusive control of their private keys.
- Private keys must never be transmitted to V COIN servers.
- Wallet signing operations must occur locally on the user's device.
- The backend must never have independent access to user funds.
- All blockchain transactions must require user authorization.

3. Platform Support

The wallet architecture must support:

- Android application
- Web wallet interface
- TON-compatible wallet connectivity
- Secure synchronization between supported interfaces

4. Key Management

Key management must include:

- Secure wallet generation
- Local private key protection
- Secure seed phrase handling
- Encrypted local storage
- Secure wallet backup
- User-controlled wallet recovery

Android security should use Android Keystore and StrongBox where supported.

Web implementations must use appropriate browser cryptographic protections and secure storage practices.

5. TON Blockchain Integration

The wallet must support:

- TON address management
- TON blockchain connectivity
- Transaction creation and signing
- Transaction status verification
- Token balance monitoring
- Jetton-compatible asset management

6. V COIN Integration

The wallet must integrate with:

- V COIN token balances
- Purchased token records
- Extracted reward records
- Confirmed token transfers
- Mining account information
- Transaction history

Purchased, extracted, pending and transferable balances must remain clearly distinguishable.

7. Transaction Security

All wallet transactions must support:

- Explicit user approval
- Local transaction signing
- Address validation
- Transaction detail verification
- Secure network communication
- Protection against unauthorized signing

8. Privacy and Data Protection

The wallet must follow these principles:

- Private keys remain local.
- Sensitive information is encrypted.
- User data collection is minimized.
- Wallet activity is protected.
- No unauthorized asset access is permitted.

9. Recovery and Continuity

The wallet must provide:

- User-controlled recovery procedures
- Secure backup guidance
- Device migration support
- Clear recovery instructions
- Protection against unauthorized recovery attempts

10. Security Testing

Before production release:

- Key-management controls must be verified through the project's documented engineering checks; no external security audit is a project release condition.
- Transaction signing must be tested.
- Android and Web security must be assessed.
- TON integration must be validated.
- Recovery procedures must be tested.
- Complete the documented internal engineering checks, local TON Sandbox tests, and explicit Founder release review; independent external security auditing is outside the current project scope.

11. Development Status

Wallet architecture specification and development preparation.

No production wallet release is authorized at this stage.

---

Project: V COIN – TON
Module: Non-Custodial Wallet
Network: The Open Network (TON)
Platforms: Android and Web
Status: Under Development
