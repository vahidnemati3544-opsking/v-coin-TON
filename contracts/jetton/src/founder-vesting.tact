import "./jetton";

// The sole time-locked tranche in the entire V COIN–TON allocation is the
// Founder's own 2B VCOIN. No Mining/Treasury/Liquidity/Ecosystem wallet is
// governed by this contract or subject to a release schedule.
const FOUNDER_VESTING_TOTAL: Int = 2000000000000000; // 2,000,000,000 VCOIN * 10^6
const FOUNDER_VESTING_DURATION: Int = 126144000; // 4 * 365 days
const FOUNDER_VESTING_DAY: Int = 86400;
const FOUNDER_VESTING_DAYS: Int = 1460;

message ClaimFounderVesting {
    query_id: Int as uint64;
}

message ConfigureFounderVestingWallet {
    wallet: Address;
}

struct FounderVestingData {
    owner: Address;
    master: Address;
    beneficiary: Address;
    funded: Bool;
    start_time: Int;
    released: Int;
    total_allocation: Int;
}

// This contract enforces only the Founder's approved four-year release schedule.
 // The beneficiary is immutable after deployment. It does not create another
 // signer or custodian; the Founder remains the sole operational authority
 // for all five ordinary allocation wallets, subject only to this 2B vesting.
contract VCoinFounderVesting {
    owner: Address;
    master: Address;
    beneficiary: Address;
    vesting_wallet: Address;
    wallet_configured: Bool = false;
    funded: Bool = false;
    start_time: Int = 0;
    released: Int = 0;

    init(owner: Address, master: Address, beneficiary: Address) {
        self.owner = owner;
        self.master = master;
        self.beneficiary = beneficiary;
        self.vesting_wallet = owner;
        self.wallet_configured = false;
        self.funded = false;
        self.start_time = 0;
        self.released = 0;
    }

    receive() {}

    // The wallet address is configured once after deployment using the
    // master contract's get_wallet_address(owner=vesting-contract) getter.
    // This avoids embedding a second independently compiled wallet code hash.
    receive(msg: ConfigureFounderVestingWallet) {
        require(context().sender == self.owner, "Only founder may configure wallet");
        require(!self.wallet_configured, "Vesting wallet already configured");
        self.vesting_wallet = msg.wallet;
        self.wallet_configured = true;
    }

    // The vesting clock starts only after the exact allocation has arrived
    // through the authentic Jetton wallet notification.
    receive(msg: TokenNotification) {
        require(self.wallet_configured, "Vesting wallet is not configured");
        require(context().sender == self.vesting_wallet, "Untrusted Jetton wallet");
        require(msg.from == self.owner, "Only founder may fund vesting");
        require(msg.amount == FOUNDER_VESTING_TOTAL, "Incorrect founder allocation");
        require(!self.funded, "Vesting already funded");
        self.funded = true;
        self.start_time = now();
    }

    // Anyone may trigger a claim; tokens can only ever go to the immutable beneficiary.
    receive(msg: ClaimFounderVesting) {
        require(self.funded, "Vesting is not funded");
        let elapsed: Int = now() - self.start_time;
        require(elapsed >= 0, "Invalid vesting clock");
        let elapsedDays: Int = elapsed / FOUNDER_VESTING_DAY;
        let vestedDays: Int = min(elapsedDays, FOUNDER_VESTING_DAYS);
        let vestedAmount: Int = (FOUNDER_VESTING_TOTAL * vestedDays) / FOUNDER_VESTING_DAYS;
        if (vestedDays >= FOUNDER_VESTING_DAYS) {
            vestedAmount = FOUNDER_VESTING_TOTAL;
        }
        let claimable: Int = vestedAmount - self.released;
        require(claimable > 0, "No vested tokens available");
        self.released = vestedAmount;

        send(SendParameters{
            to: self.vesting_wallet,
            value: ton("0.1"),
            bounce: true,
            body: TokenTransfer{
                query_id: msg.query_id,
                amount: claimable,
                destination: self.beneficiary,
                response_destination: myAddress(),
                custom_payload: null,
                forward_ton_amount: 0,
                forward_payload: beginCell().endCell().asSlice()
            }.toCell()
        });
    }

    // The source Jetton wallet restores its token balance on a downstream
    // bounce and reports that exact transfer here. Only the configured wallet
    // can trigger the rollback; a duplicate/invalid amount cannot underflow.
    receive(msg: JettonTransferBounce) {
        require(context().sender == self.vesting_wallet, "Untrusted bounce notifier");
        require(msg.amount > 0, "Invalid bounced amount");
        require(self.released >= msg.amount, "Bounce exceeds released amount");
        self.released = self.released - msg.amount;
    }

    // Restore the counter if the initial owner-to-wallet message itself bounces.
    bounced(msg: bounced<TokenTransfer>) {
        require(msg.amount > 0, "Invalid bounced transfer amount");
        require(self.released >= msg.amount, "Bounce exceeds released amount");
        self.released = self.released - msg.amount;
    }

    get fun get_vesting_wallet_address(): Address {
        return self.vesting_wallet;
    }

    get fun get_vesting_data(): FounderVestingData {
        return FounderVestingData{
            owner: self.owner,
            master: self.master,
            beneficiary: self.beneficiary,
            funded: self.funded,
            start_time: self.start_time,
            released: self.released,
            total_allocation: FOUNDER_VESTING_TOTAL
        };
    }
}
