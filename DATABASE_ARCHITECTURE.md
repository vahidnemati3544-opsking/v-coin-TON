V COIN – TON Database Architecture

1. Overview

The database is the central persistent data layer of the V COIN – TON ecosystem.

It stores and manages user accounts, wallet records, mining sessions, rewards, level progression, referrals, financial transactions, blockchain activities, and system events.

The database architecture must prioritize data integrity, security, consistency, scalability, and auditability.

2. Database Design Principles

The database must follow these principles:

- Relational data architecture
- Transactional consistency
- Referential integrity
- Unique transaction identifiers
- Secure data access
- Financial record immutability
- Efficient indexing
- Database normalization
- Audit logging
- Backup and recovery
- Horizontal scalability where appropriate

3. Database Technology

The initial recommended database technology is PostgreSQL.

PostgreSQL will serve as the primary transactional database.

Additional technologies may be introduced when necessary:

- Redis for caching and temporary data
- Message queues for asynchronous processing
- Object storage for protected backups and archived files

Technology selection must be validated during implementation.

4. User Management Tables

users

Stores core user account information.

Fields:

- id
- telegram_user_id
- username
- account_status
- created_at
- updated_at

user_profiles

Stores additional user profile information.

Fields:

- id
- user_id
- display_name
- language
- country_code
- created_at
- updated_at

user_sessions

Stores authentication session information.

Fields:

- id
- user_id
- session_token_hash
- expires_at
- created_at
- revoked_at

Authentication secrets must never be stored in plaintext.

5. Wallet Tables

wallets

Stores verified user wallet information.

Fields:

- id
- user_id
- wallet_address
- network
- wallet_type
- verification_status
- verified_at
- created_at

wallet_verifications

Stores wallet ownership verification records.

Fields:

- id
- wallet_id
- verification_method
- verification_status
- verification_reference
- created_at

Private keys and recovery phrases must never be stored.

6. Mining Tables

mining_sessions

Stores mining session information.

Fields:

- id
- user_id
- session_status
- started_at
- ended_at
- last_reward_at
- created_at

mining_rewards

Stores individual mining reward records.

Fields:

- id
- user_id
- mining_session_id
- reward_amount
- reward_status
- operation_id
- created_at

Every reward must have a unique operation identifier.

Duplicate reward processing must be prevented through database constraints and transactional logic.

7. Level Management Tables

levels

Stores available level definitions.

Fields:

- id
- level_number
- upgrade_cost
- extraction_parameters
- is_active
- created_at
- updated_at

level_upgrades

Stores user level upgrade history.

Fields:

- id
- user_id
- previous_level
- new_level
- upgrade_cost
- transaction_id
- created_at

The planned maximum level is 400.

Level upgrades must be processed atomically.

8. Referral Tables

referral_codes

Stores user referral codes.

Fields:

- id
- user_id
- referral_code
- is_active
- created_at

referral_relationships

Stores referral relationships.

Fields:

- id
- referrer_user_id
- referred_user_id
- relationship_status
- created_at

referral_rewards

Stores referral reward records.

Fields:

- id
- referral_relationship_id
- reward_amount
- reward_status
- operation_id
- created_at

Referral relationships must prevent self-referrals and circular referral structures.

9. Financial Ledger Tables

ledger_accounts

Stores internal accounting account definitions.

Fields:

- id
- account_code
- account_type
- account_status
- created_at

ledger_transactions

Stores financial transaction headers.

Fields:

- id
- operation_id
- transaction_type
- reference_type
- reference_id
- transaction_status
- created_at

ledger_entries

Stores individual debit and credit entries.

Fields:

- id
- transaction_id
- account_id
- user_id
- entry_type
- amount
- asset
- created_at
  V COIN – TON Database Architecture

1. Overview

The database is the central persistent data layer of the V COIN – TON ecosystem.

It stores and manages user accounts, wallet records, mining sessions, rewards, level progression, referrals, financial transactions, blockchain activities, and system events.

The database architecture must prioritize data integrity, security, consistency, scalability, and auditability.

2. Database Design Principles

The database must follow these principles:

- Relational data architecture
- Transactional consistency
- Referential integrity
- Unique transaction identifiers
- Secure data access
- Financial record immutability
- Efficient indexing
- Database normalization
- Audit logging
- Backup and recovery
- Horizontal scalability where appropriate

3. Database Technology

The initial recommended database technology is PostgreSQL.

PostgreSQL will serve as the primary transactional database.

Additional technologies may be introduced when necessary:

- Redis for caching and temporary data
- Message queues for asynchronous processing
- Object storage for protected backups and archived files

Technology selection must be validated during implementation.

4. User Management Tables

users

Stores core user account information.

Fields:

- id
- telegram_user_id
- username
- account_status
- created_at
- updated_at

user_profiles

Stores additional user profile information.

Fields:

- id
- user_id
- display_name
- language
- country_code
- created_at
- updated_at

user_sessions

Stores authentication session information.

Fields:

- id
- user_id
- session_token_hash
- expires_at
- created_at
- revoked_at

Authentication secrets must never be stored in plaintext.

5. Wallet Tables

wallets

Stores verified user wallet information.

Fields:

- id
- user_id
- wallet_address
- network
- wallet_type
- verification_status
- verified_at
- created_at

wallet_verifications

Stores wallet ownership verification records.

Fields:

- id
- wallet_id
- verification_method
- verification_status
- verification_reference
- created_at

Private keys and recovery phrases must never be stored.

6. Mining Tables

mining_sessions

Stores mining session information.

Fields:

- id
- user_id
- session_status
- started_at
- ended_at
- last_reward_at
- created_at

mining_rewards

Stores individual mining reward records.

Fields:

- id
- user_id
- mining_session_id
- reward_amount
- reward_status
- operation_id
- created_at

Every reward must have a unique operation identifier.

Duplicate reward processing must be prevented through database constraints and transactional logic.

7. Level Management Tables

levels

Stores available level definitions.

Fields:

- id
- level_number
- upgrade_cost
- extraction_parameters
- is_active
- created_at
- updated_at

level_upgrades

Stores user level upgrade history.

Fields:

- id
- user_id
- previous_level
- new_level
- upgrade_cost
- transaction_id
- created_at

The planned maximum level is 400.

Level upgrades must be processed atomically.

8. Referral Tables

referral_codes

Stores user referral codes.

Fields:

- id
- user_id
- referral_code
- is_active
- created_at

referral_relationships

Stores referral relationships.

Fields:

- id
- referrer_user_id
- referred_user_id
- relationship_status
- created_at

referral_rewards

Stores referral reward records.

Fields:

- id
- referral_relationship_id
- reward_amount
- reward_status
- operation_id
- created_at

Referral relationships must prevent self-referrals and circular referral structures.

9. Financial Ledger Tables

ledger_accounts

Stores internal accounting account definitions.

Fields:

- id
- account_code
- account_type
- account_status
- created_at

ledger_transactions

Stores financial transaction headers.

Fields:

- id
- operation_id
- transaction_type
- reference_type
- reference_id
- transaction_status
- created_at

ledger_entries

Stores individual debit and credit entries.

Fields:

- id
- transaction_id
- account_id
- user_id
- entry_type
- amount
- asset
- created_at
  Financial transactions must use atomic double-entry accounting where applicable.

Posted financial entries must not be silently modified or deleted.

Corrections must use documented reversal or adjustment entries.

10. Blockchain Tables

blockchain_transactions

Stores blockchain transaction records.

Fields:

- id
- user_id
- wallet_id
- transaction_hash
- network
- transaction_type
- transaction_status
- block_reference
- confirmed_at
- created_at

blockchain_events

Stores processed blockchain events.

Fields:

- id
- transaction_hash
- event_type
- event_data
- processing_status
- processed_at
- created_at

Blockchain records must be reconciled with verified TON network data.

11. System Monitoring Tables

system_events

Stores important system events.

Fields:

- id
- event_type
- event_source
- event_data
- created_at

audit_logs

Stores administrative and security-related activities.

Fields:

- id
- actor_id
- action
- resource_type
- resource_id
- result
- created_at

Audit records must be protected against unauthorized modification.

12. Database Relationships

The main relationships include:

- One user can have multiple wallets.
- One user can have multiple mining sessions.
- One mining session can generate multiple reward records.
- One user can have multiple level upgrade records.
- One user can have one referral code.
- One referral relationship connects a referrer and a referred user.
- One ledger transaction can contain multiple ledger entries.
- One wallet can have multiple blockchain transactions.

All relationships must enforce appropriate foreign key constraints.

13. Data Integrity

Required mechanisms:

- Primary keys
- Foreign keys
- Unique constraints
- Database transactions
- Check constraints
- Atomic financial operations
- Idempotency protection
- Consistent transaction states
- Balance reconciliation

Financial and reward balances must be derived from authoritative records rather than independently editable client values.

14. Security and Access Control

Database security must include:

- Restricted database accounts
- Least-privilege permissions
- Encrypted connections
- Protected credentials
- Secure backup encryption
- Controlled administrative access
- Sensitive data protection
- Database activity auditing

Application services must only access the tables and operations required for their responsibilities.

15. Indexing and Performance

Important indexing targets include:

- telegram_user_id
- wallet_address
- transaction_hash
- operation_id
- referral_code
- user_id
- mining_session_id
- transaction_status
- created_at

Indexes must be selected according to actual query patterns and performance testing.

16. Backup and Recovery

The database must support:

- Automated backups
- Encrypted backup storage
- Point-in-time recovery where supported
- Backup integrity verification
- Disaster recovery procedures
- Periodic recovery testing

Backup procedures must be documented and tested before production deployment.

17. Data Retention and Archiving

The system must define retention policies for:

- User account records
- Mining history
- Financial ledger entries
- Blockchain transactions
- Security events
- Administrative audit logs

Financial and audit records must follow applicable legal retention requirements.

18. Scalability

The database architecture must support:

- Connection pooling
- Query optimization
- Read replicas where appropriate
- Partitioning for large historical tables
- Background data processing
- Database monitoring

Any scaling strategy must preserve transactional consistency.

19. Development and Testing

Database implementation must include:

- Version-controlled migrations
- Schema validation
- Automated database tests
- Referential integrity tests
- Transaction consistency tests
- Duplicate operation tests
- Backup recovery tests
- Performance tests

Development, testing, staging, and production databases must remain logically separated.

20. Development Roadmap

Implementation will proceed through controlled stages:
