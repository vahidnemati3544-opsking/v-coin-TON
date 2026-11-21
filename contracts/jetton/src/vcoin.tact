import "./jetton";

const VCOIN_MAX_SUPPLY: Int = 10000000000000000; // 10,000,000,000 VCOIN * 10^6

message VCoinMint {
    receiver: Address;
    amount: Int as coins;
}

contract VCoinMaster with JettonMaster {
    total_supply: Int as coins = 0;
    mintable: Bool = true;
    owner: Address;
    content: Cell;

    init(owner: Address, content: Cell) {
        self.total_supply = 0;
        self.mintable = true;
        self.owner = owner;
        self.content = content;
    }

    // Accept the empty deployment message only; this does not issue tokens.
    receive() {}

    // One-time issuance: the exact full supply is credited to the founder's
    // own wallet. The founder then distributes allocations with signed transfers.
    receive(msg: VCoinMint) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Unauthorized issuance authority");
        require(self.mintable, "Initial issuance already completed");
        require(self.total_supply == 0, "Initial supply already issued");
        require(msg.receiver == self.owner, "Initial supply must go to owner wallet");
        require(msg.amount == VCOIN_MAX_SUPPLY, "Must issue exact fixed supply");
        self.mintTo(msg.receiver, msg.amount, self.owner);
        self.mintable = false;
    }

    // If the initial wallet-credit message bounces, roll back the recorded
    // supply and permit the founder to retry the same one-time issuance.
    bounced(msg: bounced<TokenTransferInternal>) {
        require(self.total_supply >= msg.amount, "Bounced issuance exceeds recorded supply");
        self.total_supply = self.total_supply - msg.amount;
        if (self.total_supply == 0) {
            self.mintable = true;
        }
    }
}
