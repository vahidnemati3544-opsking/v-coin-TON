import "./jetton";

const FOUNDER_VESTING_TOTAL: Int = 2000000000000000; // 2,000,000,000 VCOIN * 10^6
const FOUNDER_VESTING_DURATION: Int = 126144000; // 4 * 365 days
const FOUNDER_VESTING_DAY: Int = 86400;
const FOUNDER_VESTING_DAYS: Int = 1460;

message ClaimFounderVesting {
    query_id: Int as uint64;
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

contract VCoinFounderVesting {
    owner: Address;
    master: Address;
    beneficiary: Address;
    funded: Bool = false;
    start_time: Int = 0;
    released: Int = 0;

    init(owner: Address, master: Address, beneficiary: Address) {
        self.owner = owner;
        self.master = master;
        self.beneficiary = beneficiary;
        self.funded = false;
        self.start_time = 0;
        self.released = 0;
    }

    receive() {}

    fun vestingWalletAddress(): Address {
        let walletInit: StateInit = initOf VCoinJettonWallet(myAddress(), self.master);
        return contractAddress(walletInit);
    }

    // The vesting clock starts only after the exact allocation has arrived
    // through the authentic Jetton wallet notification.
    receive(msg: TokenNotification) {
        require(sender() == self.vestingWalletAddress(), "Untrusted Jetton wallet");
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
            to: self.vestingWalletAddress(),
            value: ton("0.1"),
            bounce: true,
            body: TokenTransfer{
                query_id: msg.query_id,
                amount: claimable,
                destination: self.beneficiary,
                response_destination: self.owner,
                custom_payload: null,
                forward_ton_amount: 0,
                forward_payload: beginCell().endCell().asSlice()
            }.toCell()
        });
    }

    // Restore the vesting counter if the vesting wallet itself rejects the
    // outgoing transfer message. Downstream Jetton-wallet recovery is handled
    // by the standard wallet bounce handler.
    bounced(msg: bounced<TokenTransfer>) {
        self.released = self.released - msg.amount;
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
