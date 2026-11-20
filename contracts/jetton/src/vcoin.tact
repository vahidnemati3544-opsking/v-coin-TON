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

    // One-time issuance: exactly the full fixed supply, to the founder-controlled
    // initial custody wallet. The founder distributes allocations by ordinary
    // signed Jetton transfers after verifying all five destination wallets.
    receive(msg: VCoinMint) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Unauthorized issuance authority");
        require(self.mintable, "Initial issuance already completed");
        require(self.total_supply == 0, "Initial supply already issued");
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
