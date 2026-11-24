import "./jetton";

const VCOIN_MAX_SUPPLY: Int = 2100000000000000; // 2,100,000,000 VCOIN * 10^6
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

    first_receipt_amount: Int as coins = 0;
    first_receipt_issued: Bool = false;
    second_receipt_issued: Bool = false;

    init(owner: Address, content: Cell) {
        self.total_supply = 0;
        self.mintable = true;
        self.owner = owner;
        self.content = content;
        self.first_receipt_amount = 0;
        self.first_receipt_issued = false;
        self.second_receipt_issued = false;
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

    // Two-stage, Founder-only initial receipt. Stage 1 may be any positive
    // amount below the hard cap. Stage 2 must be the exact remaining supply.
    // Each call is a separate Founder-signed on-chain transaction.
    receive(msg: VCoinMint) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Unauthorized issuance authority");
        require(msg.receiver == self.owner, "Initial receipt must go to Founder wallet");
        require(self.mintable, "Fixed supply already fully received");
        require(ctx.value >= ton("0.01"), "Insufficient TON for issuance request");
        require(myBalance() >= ton("0.15"), "Master gas reserve is insufficient");
        require(msg.amount > 0, "Receipt amount must be positive");
        require(self.total_supply + msg.amount <= VCOIN_MAX_SUPPLY, "Fixed supply exceeded");

        if (!self.first_receipt_issued) {
            require(msg.amount < VCOIN_MAX_SUPPLY, "Stage 1 must leave a Stage 2 remainder");
            self.first_receipt_amount = msg.amount;
            self.first_receipt_issued = true;
            self.mintTo(self.owner, msg.amount, self.owner, 1);
        } else {
            require(!self.second_receipt_issued, "Stage 2 already issued");
            require(
                msg.amount == VCOIN_MAX_SUPPLY - self.first_receipt_amount,
                "Stage 2 must equal the exact remaining supply"
            );
            self.second_receipt_issued = true;
            self.mintTo(self.owner, msg.amount, self.owner, 2);
            self.mintable = false;
        }
    }

    // Only a natural bounce from the deterministic Founder Jetton wallet may
    // roll back the matching stage. Stage 2 can be retried without reissuing
    // Stage 1; a Stage 1 bounce resets the two-stage process.
    bounced(msg: bounced<TokenTransferInternal>) {
        let ctx: Context = context();
        require(
            ctx.sender == contractAddress(self.walletInit(self.owner)),
            "Untrusted Founder wallet bounce"
        );
        require(self.total_supply >= msg.amount, "Bounce rollback exceeds supply");
        if (msg.query_id == 1) {
            require(self.first_receipt_issued, "No Stage 1 receipt is pending");
            require(msg.amount == self.first_receipt_amount, "Invalid Stage 1 bounce amount");
            self.total_supply = self.total_supply - msg.amount;
            self.first_receipt_amount = 0;
            self.first_receipt_issued = false;
        } else if (msg.query_id == 2) {
            require(self.second_receipt_issued, "No Stage 2 receipt is pending");
            require(
                msg.amount == VCOIN_MAX_SUPPLY - self.first_receipt_amount,
                "Invalid Stage 2 bounce amount"
            );
            self.total_supply = self.total_supply - msg.amount;
            self.second_receipt_issued = false;
            self.mintable = true;
        } else {
            require(false, "Unknown receipt stage bounce");
        }
    }

    get fun get_receipt_status(): VCoinReceiptStatus {
        return VCoinReceiptStatus{
            first_receipt_amount: self.first_receipt_amount,
            first_receipt_issued: self.first_receipt_issued,
            second_receipt_issued: self.second_receipt_issued,
            remaining_supply: VCOIN_MAX_SUPPLY - self.total_supply
        };
    }

    get fun get_gas_operator_wallet(): Address { return self.owner; }
}
