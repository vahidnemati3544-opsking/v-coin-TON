import "./jetton";

const VCOIN_MAX_SUPPLY: Int = 2100000000000000; // 2,100,000,000 VCOIN * 10^6
const VCOIN_STAGE_1: Int = 420000000000000;
const VCOIN_STAGE_2: Int = 1050000000000000;
const VCOIN_STAGE_3: Int = 210000000000000;
const VCOIN_STAGE_4: Int = 210000000000000;
const VCOIN_STAGE_5: Int = 210000000000000;
const VCOIN_MIN_MASTER_RESERVE: Int = ton("0.25");
const VCOIN_WITHDRAWAL_FEE_BUFFER: Int = ton("0.10");

message VCoinMint {
    receiver: Address;
    amount: Int as coins;
}
message VCoinFund {}
message VCoinWithdraw { amount: Int as coins; }

contract VCoinMaster with JettonMaster {
    total_supply: Int as coins = 0;
    mintable: Bool = true;
    owner: Address;
    content: Cell;

    next_receipt_stage: Int = 1;
    receipt_pending: Bool = false;
    pending_receipt_amount: Int as coins = 0;
    stage_1_confirmed: Bool = false;
    stage_2_confirmed: Bool = false;
    stage_3_confirmed: Bool = false;
    stage_4_confirmed: Bool = false;
    stage_5_confirmed: Bool = false;

    init(owner: Address, content: Cell) {
        self.total_supply = 0;
        self.mintable = true;
        self.owner = owner;
        self.content = content;
        self.next_receipt_stage = 1;
        self.receipt_pending = false;
        self.pending_receipt_amount = 0;
        self.stage_1_confirmed = false;
        self.stage_2_confirmed = false;
        self.stage_3_confirmed = false;
        self.stage_4_confirmed = false;
        self.stage_5_confirmed = false;
    }

    fun expectedReceiptAmount(stage: Int): Int {
        if (stage == 1) { return VCOIN_STAGE_1; }
        if (stage == 2) { return VCOIN_STAGE_2; }
        if (stage == 3) { return VCOIN_STAGE_3; }
        if (stage == 4) { return VCOIN_STAGE_4; }
        if (stage == 5) { return VCOIN_STAGE_5; }
        return 0;
    }

    receive(msg: VCoinFund) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Unauthorized gas funding source");
        require(ctx.value >= ton("0.75"), "Gas reserve deposit must be at least 0.75 TON");
    }

    receive(msg: VCoinWithdraw) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Unauthorized TON withdrawal");
        require(msg.amount > 0, "Withdrawal amount must be positive");
        require(ctx.value >= ton("0.01"), "Insufficient withdrawal request value");
        require(
            myBalance() >= msg.amount + VCOIN_MIN_MASTER_RESERVE + VCOIN_WITHDRAWAL_FEE_BUFFER,
            "Withdrawal would breach Master reserve"
        );
        send(SendParameters{
            to: self.owner,
            value: msg.amount,
            mode: SendPayGasSeparately,
            bounce: true,
            body: beginCell().endCell()
        });
    }

    // Five exact Founder-first receipts. Each stage is separately signed and
    // cannot begin until the preceding Founder Jetton-wallet credit is acknowledged.
    receive(msg: VCoinMint) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Unauthorized issuance authority");
        require(msg.receiver == self.owner, "Initial receipt must go to Founder wallet");
        require(self.mintable, "Fixed supply already fully received");
        require(!self.receipt_pending, "Previous receipt stage is still pending");
        require(ctx.value >= ton("0.01"), "Insufficient TON for issuance request");
        require(myBalance() >= ton("0.15"), "Master gas reserve is insufficient");
        require(self.next_receipt_stage >= 1 && self.next_receipt_stage <= 5, "All five receipt stages are complete");
        let expected: Int = self.expectedReceiptAmount(self.next_receipt_stage);
        require(msg.amount == expected, "Receipt amount does not match the approved stage amount");
        require(self.total_supply + msg.amount <= VCOIN_MAX_SUPPLY, "Fixed supply exceeded");
        self.receipt_pending = true;
        self.pending_receipt_amount = msg.amount;
        self.mintTo(self.owner, msg.amount, self.owner, self.next_receipt_stage);
    }

    // Idempotent acknowledgement: the deterministic Founder wallet may resend
    // a previously delivered acknowledgement without advancing a stage twice.
    receive(msg: VCoinReceiptAcknowledgement) {
        let ctx: Context = context();
        require(ctx.sender == contractAddress(self.walletInit(self.owner)), "Untrusted receipt acknowledgement wallet");
        require(msg.query_id >= 1 && msg.query_id <= 5, "Unknown receipt acknowledgement stage");
        let expected: Int = self.expectedReceiptAmount(msg.query_id);
        require(msg.amount == expected, "Receipt acknowledgement amount mismatch");
        if (msg.query_id == self.next_receipt_stage) {
            require(self.receipt_pending && self.pending_receipt_amount == msg.amount, "No matching receipt is pending");
            self.receipt_pending = false;
            self.pending_receipt_amount = 0;
            if (msg.query_id == 1) {
                self.stage_1_confirmed = true;
            } else if (msg.query_id == 2) {
                self.stage_2_confirmed = true;
            } else if (msg.query_id == 3) {
                self.stage_3_confirmed = true;
            } else if (msg.query_id == 4) {
                self.stage_4_confirmed = true;
            } else {
                self.stage_5_confirmed = true;
                self.mintable = false;
            }
            self.next_receipt_stage = self.next_receipt_stage + 1;
        } else {
            require(msg.query_id < self.next_receipt_stage, "Unexpected receipt acknowledgement sequence");
        }
    }

    // A natural bounce rolls back only the pending stage. The same exact stage
    // can then be retried; confirmed earlier stages remain untouched.
    bounced(msg: bounced<TokenTransferInternal>) {
        let ctx: Context = context();
        require(ctx.sender == contractAddress(self.walletInit(self.owner)), "Untrusted Founder wallet bounce");
        require(self.receipt_pending, "No receipt stage is pending");
        require(msg.query_id == self.next_receipt_stage, "Bounce stage does not match the pending stage");
        require(msg.amount == self.pending_receipt_amount, "Bounce amount does not match the pending stage");
        require(self.total_supply >= msg.amount, "Bounce rollback exceeds supply");
        self.total_supply = self.total_supply - msg.amount;
        self.receipt_pending = false;
        self.pending_receipt_amount = 0;
    }

    get fun get_receipt_status(): VCoinReceiptStatus {
        return VCoinReceiptStatus{
            next_receipt_stage: self.next_receipt_stage,
            receipt_pending: self.receipt_pending,
            pending_receipt_amount: self.pending_receipt_amount,
            stage_1_confirmed: self.stage_1_confirmed,
            stage_2_confirmed: self.stage_2_confirmed,
            stage_3_confirmed: self.stage_3_confirmed,
            stage_4_confirmed: self.stage_4_confirmed,
            stage_5_confirmed: self.stage_5_confirmed,
            remaining_supply: VCOIN_MAX_SUPPLY - self.total_supply
        };
    }

    get fun get_gas_operator_wallet(): Address { return self.owner; }
}
