import "./jetton";

const VCOIN_MAX_SUPPLY: Int = 10000000000000000;
const FOUNDER_CAP: Int = 2000000000000000;
const MINING_CAP: Int = 5000000000000000;
const TREASURY_CAP: Int = 1000000000000000;
const LIQUIDITY_CAP: Int = 1000000000000000;
const ECOSYSTEM_CAP: Int = 1000000000000000;

message VCoinConfigureAllocations {
    founder: Address;
    mining: Address;
    treasury: Address;
    liquidity: Address;
    ecosystem: Address;
}

message VCoinMintAllocation {
    category: Int as uint8;
}

contract VCoinMaster with JettonMaster {
    total_supply: Int as coins = 0;
    mintable: Bool = true;
    owner: Address;
    content: Cell;

    allocations_configured: Bool = false;
    founder_destination: Address;
    mining_destination: Address;
    treasury_destination: Address;
    liquidity_destination: Address;
    ecosystem_destination: Address;

    founder_issued: Bool = false;
    mining_issued: Bool = false;
    treasury_issued: Bool = false;
    liquidity_issued: Bool = false;
    ecosystem_issued: Bool = false;

    init(owner: Address, content: Cell) {
        self.total_supply = 0;
        self.mintable = true;
        self.owner = owner;
        self.content = content;
        self.founder_destination = owner;
        self.mining_destination = owner;
        self.treasury_destination = owner;
        self.liquidity_destination = owner;
        self.ecosystem_destination = owner;
        self.allocations_configured = false;
        self.founder_issued = false;
        self.mining_issued = false;
        self.treasury_issued = false;
        self.liquidity_issued = false;
        self.ecosystem_issued = false;
    }

    receive() {}

    // GOVERNANCE INVARIANT (VCT-GOV-FOUNDER-001 v1.1.0):
    // Founder alone has unrestricted transfer authority over all five
    // ordinary allocation wallets. No category is subject to vesting,
    // escrow, time locks, withdrawal ceilings, or third-party approvals.
    // The five destinations are distinct and immutable after configuration;
    // this is an accounting/issuance control, not a restriction on transfers.
    receive(msg: VCoinConfigureAllocations) {
        require(context().sender == self.owner, "Unauthorized allocation configuration");
        require(!self.allocations_configured, "Allocations already configured");
        require(self.total_supply == 0, "Issuance already started");
        require(msg.founder != msg.mining, "Duplicate allocation destination");
        require(msg.founder != msg.treasury, "Duplicate allocation destination");
        require(msg.founder != msg.liquidity, "Duplicate allocation destination");
        require(msg.founder != msg.ecosystem, "Duplicate allocation destination");
        require(msg.mining != msg.treasury, "Duplicate allocation destination");
        require(msg.mining != msg.liquidity, "Duplicate allocation destination");
        require(msg.mining != msg.ecosystem, "Duplicate allocation destination");
        require(msg.treasury != msg.liquidity, "Duplicate allocation destination");
        require(msg.treasury != msg.ecosystem, "Duplicate allocation destination");
        require(msg.liquidity != msg.ecosystem, "Duplicate allocation destination");

        self.founder_destination = msg.founder;
        self.mining_destination = msg.mining;
        self.treasury_destination = msg.treasury;
        self.liquidity_destination = msg.liquidity;
        self.ecosystem_destination = msg.ecosystem;
        self.allocations_configured = true;
    }

    // Categories: 1 Founder (20%), 2 Mining (50%), 3 Treasury (10%),
    // 4 Liquidity/Market (10%), 5 Ecosystem/Marketing (10%).
    // Each category can be issued exactly once for its immutable cap.
    receive(msg: VCoinMintAllocation) {
        require(context().sender == self.owner, "Unauthorized issuance authority");
        require(self.allocations_configured, "Allocation destinations not configured");
        require(self.mintable, "All allocations issued");

        if (msg.category == 1) {
            require(!self.founder_issued, "Founder allocation already issued");
            self.founder_issued = true;
            self.mintTo(self.founder_destination, FOUNDER_CAP, self.owner, 1);
        } else if (msg.category == 2) {
            require(!self.mining_issued, "Mining allocation already issued");
            self.mining_issued = true;
            self.mintTo(self.mining_destination, MINING_CAP, self.owner, 2);
        } else if (msg.category == 3) {
            require(!self.treasury_issued, "Treasury allocation already issued");
            self.treasury_issued = true;
            self.mintTo(self.treasury_destination, TREASURY_CAP, self.owner, 3);
        } else if (msg.category == 4) {
            require(!self.liquidity_issued, "Liquidity allocation already issued");
            self.liquidity_issued = true;
            self.mintTo(self.liquidity_destination, LIQUIDITY_CAP, self.owner, 4);
        } else if (msg.category == 5) {
            require(!self.ecosystem_issued, "Ecosystem allocation already issued");
            self.ecosystem_issued = true;
            self.mintTo(self.ecosystem_destination, ECOSYSTEM_CAP, self.owner, 5);
        } else {
            require(false, "Unknown allocation category");
        }

        if (self.founder_issued && self.mining_issued && self.treasury_issued && self.liquidity_issued && self.ecosystem_issued) {
            require(self.total_supply == VCOIN_MAX_SUPPLY, "Allocation sum mismatch");
            self.mintable = false;
        }
    }

    // A failed Jetton-wallet deployment/credit returns the exact category
    // message. Re-open only that category; successful categories remain locked.
    bounced(msg: bounced<TokenTransferInternal>) {
        require(self.mintable || self.total_supply == VCOIN_MAX_SUPPLY, "Unexpected issuance bounce");
        if (msg.query_id == 1) {
            require(self.founder_issued && msg.amount == FOUNDER_CAP, "Invalid Founder bounce");
            self.founder_issued = false;
        } else if (msg.query_id == 2) {
            require(self.mining_issued && msg.amount == MINING_CAP, "Invalid Mining bounce");
            self.mining_issued = false;
        } else if (msg.query_id == 3) {
            require(self.treasury_issued && msg.amount == TREASURY_CAP, "Invalid Treasury bounce");
            self.treasury_issued = false;
        } else if (msg.query_id == 4) {
            require(self.liquidity_issued && msg.amount == LIQUIDITY_CAP, "Invalid Liquidity bounce");
            self.liquidity_issued = false;
        } else if (msg.query_id == 5) {
            require(self.ecosystem_issued && msg.amount == ECOSYSTEM_CAP, "Invalid Ecosystem bounce");
            self.ecosystem_issued = false;
        } else {
            require(false, "Unknown issuance bounce");
        }
        require(self.total_supply >= msg.amount, "Bounced issuance exceeds recorded supply");
        self.total_supply = self.total_supply - msg.amount;
        self.mintable = true;
    }
}
