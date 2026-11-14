### referral_relationships

Stores referral relationships.

Fields:

- id
- referrer_user_id
- referred_user_id
- created_at

A referred user may have only one direct referrer.

Self-referrals must be rejected.

Circular referral relationships must be prevented through backend validation and transactional checks.

### referral_rewards

Stores referral reward records.

Fields:

- id
- referral_relationship_id
- amount_base_units
- operation_id
- status
- created_at

Referral rewards must use unique operation identifiers and must not be credited more than once.
- Reject duplicate operations.
- Use database transactions for financial updates.
- Lock relevant records when concurrent operations may conflict.
- Validate account ownership and permissions.
- Verify available balances before spending.
- Record successful and failed operations.
- Reconcile ledger records and balance snapshots.

Database uniqueness constraints must be combined with backend transaction logic.

## 16. Security and Access Control

Database security must include:

- Least-privilege database accounts
- Restricted administrative permissions
- Encrypted database connections
- Protected environment credentials
- Secure backup encryption
- Controlled access to sensitive records
- Audit logging
- Input validation
- Protection against SQL injection

Private keys and seed phrases must remain outside the database.

Production credentials must never be committed to GitHub.
## 17. Indexing and Performance

Important indexing targets include:

- telegram_user_id
- user_id
- wallet_address
- transaction_hash
- operation_id
- referral_code
- mining_session_id
- transaction status
- created_at

Indexes must be reviewed against actual application query patterns.

Performance changes must not weaken transaction integrity.

## 18. Backup and Recovery

The database must support:

- Automated backups
- Encrypted backup storage
- Point-in-time recovery where supported
- Backup integrity verification
- Disaster recovery procedures
- Periodic recovery testing

Backup and recovery procedures must be documented before production deployment.

## 19. Data Retention and Archiving

Retention policies must be defined for:

- User account records
- Mining history
- Financial ledger entries
- Blockchain transactions
- Security events
- Administrative audit logs

Financial and audit records must follow applicable legal retention requirements.

## 20. Scalability

The architecture must support:

- Database connection pooling
- Query optimization
- Read replicas where appropriate
- Partitioning of large historical tables
- Background processing
- Database monitoring
- Controlled database migrations

Scaling strategies must preserve transactional consistency.

## 21. Development and Testing

Database implementation must include:

- Version-controlled migrations
- Schema validation
- Automated database tests
- Referential integrity tests
- Financial transaction consistency tests
- Duplicate operation tests
- Reward calculation tests
- Backup recovery tests
- Performance tests

Development, testing, staging, and production databases must remain logically separated.

## 22. Tokenomics and Blockchain Supply

The database records user activity and internal accounting.

It does not independently create or authorize blockchain token supply.

The approved V COIN tokenomics design specifies:

- Total supply: 10,000,000,000 VCOIN
- Decimals: 6
- Additional minting: Not permitted
- Founder allocation: 20%
- Founder allocation amount: 2,000,000,000 VCOIN
- Founder vesting period: 4 years
- Mining rewards allocation: 50%
- Mining rewards reserve: 5,000,000,000 VCOIN
- Mining distribution target: At least 2 years
- Treasury allocation: 10%
- Liquidity allocation: 10%
- Ecosystem and marketing allocation: 10%

These allocations must be enforced and reconciled through the approved token contract and its deployment procedures.

Database records alone do not prove on-chain token ownership.

Mainnet deployment and token issuance require separate explicit authorization.

## 23. Database Implementation Roadmap

Implementation will proceed through controlled stages:

1. Core PostgreSQL schema.
2. Database connection and configuration.
3. Database migration management.
4. User and wallet services.
5. Mining and reward services.
6. Level progression services.
7. Referral services.
8. Double-entry financial ledger.
9. TON blockchain integration.
10. Security and audit implementation.
11. Automated database testing.
12. Backup and recovery validation.
13. Production readiness review.

Each stage must be tested before proceeding to the next stage.

## 24. Document Maintenance

This document must remain consistent with:

- contracts/mining/backend/database/schema.sql
- docs/TOKENOMICS.md
- BACKEND-ARCHITECTURE.md
- API_ARCHITECTURE.md
- SECURITY_ANTI_FRAUD.md

Any database schema change must be reflected in this document.

Changes to production databases must use reviewed and version-controlled migrations.

---

End of Document

V COIN – TON Database Architecture  
Version 1.1.0
