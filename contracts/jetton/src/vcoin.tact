import "./jetton";

const VCOIN_MAX_SUPPLY: Int = 10000000000000000; // 10,000,000,000 VCOIN * 10^6
const VCOIN_FOUNDER_ALLOCATION: Int = 2000000000000000; // 2,000,000,000 VCOIN
const VCOIN_MINING_ALLOCATION: Int = 5000000000000000; // 5,000,000,000 VCOIN
const VCOIN_TREASURY_ALLOCATION: Int = 1000000000000000; // 1,000,000,000 VCOIN
const VCOIN_LIQUIDITY_ALLOCATION: Int = 1000000000000000; // 1,000,000,000 VCOIN
const VCOIN_ECOSYSTEM_ALLOCATION: Int = 1000000000000000; // 1,000,000,000 VCOIN

message VCoinMint {
    receiver: Address;
    amount: Int as coins;
}

contract VCoinMaster with JettonMaster {
    total_supply: Int as coins = 0;
    mintable: Bool = true;
    owner: Address;
    content: Cell;

    mining_reserve_wallet: Address;
    treasury_wallet: Address;
    liquidity_wallet: Address;
    ecosystem_wallet: Address;

    founder_issued: Bool = false;
    mining_reserve_issued: Bool = false;
    treasury_issued: Bool = false;
    liquidity_issued: Bool = false;
    ecosystem_issued: Bool = false;

    // The five destination addresses are fixed in StateInit at deployment.
    // owner is the founder wallet; the other four destinations cannot be changed.
    init(
        owner: Address,
        content: Cell,
        miningReserveWallet: Address,
        treasuryWallet: Address,
        liquidityWallet: Address,
        ecosystemWallet: Address
    ) {
        require(owner != miningReserveWallet, "Duplicate allocation wallet");
        require(owner != treasuryWallet, "Duplicate allocation wallet");
        require(owner != liquidityWallet, "Duplicate allocation wallet");
        require(owner != ecosystemWallet, "Duplicate allocation wallet");
        require(miningReserveWallet != treasuryWallet, "Duplicate allocation wallet");
        require(miningReserveWallet != liquidityWallet, "Duplicate allocation wallet");
        require(miningReserveWallet != ecosystemWallet, "Duplicate allocation wallet");
        require(treasuryWallet != liquidityWallet, "Duplicate allocation wallet");
        require(treasuryWallet != ecosystemWallet, "Duplicate allocation wallet");
        require(liquidityWallet != ecosystemWallet, "Duplicate allocation wallet");

        self.total_supply = 0;
        self.mintable = true;
        self.owner = owner;
        self.content = content;
        self.mining_reserve_wallet = miningReserveWallet;
        self.treasury_wallet = treasuryWallet;
        self.liquidity_wallet = liquidityWallet;
        self.ecosystem_wallet = ecosystemWallet;
        self.founder_issued = false;
        self.mining_reserve_issued = false;
        self.treasury_issued = false;
        self.liquidity_issued = false;
        self.ecosystem_issued = false;
    }

    // Owner-authorized allocation issuance. Each approved wallet can receive
    // only its exact allocation and only once; no arbitrary receiver or amount
    // is accepted. A bounced share alone becomes eligible for retry.
    receive(msg: VCoinMint) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Unauthorized issuance authority");
        require(self.mintable, "All allocations already issued");
        require(ctx.value >= ton("0.1"), "Insufficient TON for wallet deployment");
        require(self.total_supply + msg.amount <= VCOIN_MAX_SUPPLY, "Fixed supply exceeded");

        if (msg.receiver == self.owner) {
            require(!self.founder_issued, "Founder allocation already issued");
            require(msg.amount == VCOIN_FOUNDER_ALLOCATION, "Invalid founder allocation");
            self.mintTo(msg.receiver, msg.amount, self.owner);
            self.founder_issued = true;
        } else if (msg.receiver == self.mining_reserve_wallet) {
            require(!self.mining_reserve_issued, "Mining allocation already issued");
            require(msg.amount == VCOIN_MINING_ALLOCATION, "Invalid mining allocation");
            self.mintTo(msg.receiver, msg.amount, self.owner);
            self.mining_reserve_issued = true;
        } else if (msg.receiver == self.treasury_wallet) {
            require(!self.treasury_issued, "Treasury allocation already issued");
            require(msg.amount == VCOIN_TREASURY_ALLOCATION, "Invalid treasury allocation");
            self.mintTo(msg.receiver, msg.amount, self.owner);
            self.treasury_issued = true;
        } else if (msg.receiver == self.liquidity_wallet) {
            require(!self.liquidity_issued, "Liquidity allocation already issued");
            require(msg.amount == VCOIN_LIQUIDITY_ALLOCATION, "Invalid liquidity allocation");
            self.mintTo(msg.receiver, msg.amount, self.owner);
            self.liquidity_issued = true;
        } else if (msg.receiver == self.ecosystem_wallet) {
            require(!self.ecosystem_issued, "Ecosystem allocation already issued");
            require(msg.amount == VCOIN_ECOSYSTEM_ALLOCATION, "Invalid ecosystem allocation");
            self.mintTo(msg.receiver, msg.amount, self.owner);
            self.ecosystem_issued = true;
        } else {
            require(false, "Receiver is not an approved allocation wallet");
        }

        if (
            self.founder_issued &&
            self.mining_reserve_issued &&
            self.treasury_issued &&
            self.liquidity_issued &&
            self.ecosystem_issued
        ) {
            self.mintable = false;
        }
    }

    // A bounce is accepted only from the deterministic wallet for the
    // matching fixed allocation. Only that allocation is rolled back, so the
    // owner can retry it without reissuing any successfully credited share.
    bounced(msg: bounced<TokenTransferInternal>) {
        let ctx: Context = context();

        if (ctx.sender == contractAddress(self.walletInit(self.owner))) {
            require(self.founder_issued, "No founder allocation is pending");
            require(msg.amount == VCOIN_FOUNDER_ALLOCATION, "Invalid founder bounce amount");
            require(self.total_supply >= msg.amount, "Founder rollback exceeds supply");
            self.total_supply = self.total_supply - msg.amount;
            self.founder_issued = false;
            self.mintable = true;
        } else if (ctx.sender == contractAddress(self.walletInit(self.mining_reserve_wallet))) {
            require(self.mining_reserve_issued, "No mining allocation is pending");
            require(msg.amount == VCOIN_MINING_ALLOCATION, "Invalid mining bounce amount");
            require(self.total_supply >= msg.amount, "Mining rollback exceeds supply");
            self.total_supply = self.total_supply - msg.amount;
            self.mining_reserve_issued = false;
            self.mintable = true;
        } else if (ctx.sender == contractAddress(self.walletInit(self.treasury_wallet))) {
            require(self.treasury_issued, "No treasury allocation is pending");
            require(msg.amount == VCOIN_TREASURY_ALLOCATION, "Invalid treasury bounce amount");
            require(self.total_supply >= msg.amount, "Treasury rollback exceeds supply");
            self.total_supply = self.total_supply - msg.amount;
            self.treasury_issued = false;
            self.mintable = true;
        } else if (ctx.sender == contractAddress(self.walletInit(self.liquidity_wallet))) {
            require(self.liquidity_issued, "No liquidity allocation is pending");
            require(msg.amount == VCOIN_LIQUIDITY_ALLOCATION, "Invalid liquidity bounce amount");
            require(self.total_supply >= msg.amount, "Liquidity rollback exceeds supply");
            self.total_supply = self.total_supply - msg.amount;
            self.liquidity_issued = false;
            self.mintable = true;
        } else if (ctx.sender == contractAddress(self.walletInit(self.ecosystem_wallet))) {
            require(self.ecosystem_issued, "No ecosystem allocation is pending");
            require(msg.amount == VCOIN_ECOSYSTEM_ALLOCATION, "Invalid ecosystem bounce amount");
            require(self.total_supply >= msg.amount, "Ecosystem rollback exceeds supply");
            self.total_supply = self.total_supply - msg.amount;
            self.ecosystem_issued = false;
            self.mintable = true;
        } else {
            require(false, "Untrusted allocation bounce sender");
        }
    }

    get fun get_allocation_config(): VCoinAllocationConfig {
        return VCoinAllocationConfig{
            founder_wallet: self.owner,
            mining_reserve_wallet: self.mining_reserve_wallet,
            treasury_wallet: self.treasury_wallet,
            liquidity_wallet: self.liquidity_wallet,
            ecosystem_wallet: self.ecosystem_wallet
        };
    }

    get fun get_allocation_status(): VCoinAllocationStatus {
        return VCoinAllocationStatus{
            founder_issued: self.founder_issued,
            mining_reserve_issued: self.mining_reserve_issued,
            treasury_issued: self.treasury_issued,
            liquidity_issued: self.liquidity_issued,
            ecosystem_issued: self.ecosystem_issued
        };
    }
}
