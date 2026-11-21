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

    // One-time issuance: the exact full supply is credited to the founder's
    // own wallet. The founder then distributes allocations with signed transfers.
    receive(msg: VCoinMint) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Unauthorized issuance authority");
        require(self.mintable, "Initial issuance already completed");
        require(self.total_supply == 0, "Initial supply already issued");
        require(msg.receiver == self.owner, "Initial supply must go to owner wallet");
        require(msg.amount == VCOIN_MAX_SUPPLY, "Must issue exact fixed supply");
        // Keep enough TON in the inbound message to deploy and execute the
        // deterministic owner wallet. A low-value mint can otherwise fail
        // before a bounce can be funded, leaving supply recorded but uncredited.
        require(ctx.value >= ton("0.1"), "Insufficient TON for initial wallet deployment");
        self.mintTo(msg.receiver, msg.amount, self.owner);
        self.mintable = false;
    }

    // Only the owner's deterministic Jetton wallet may report a failed
    // initial wallet-credit message. The only valid rollback is the complete
    // fixed-supply issuance; partial or stale bounce payloads are rejected.
    bounced(msg: bounced<TokenTransferInternal>) {
        let ctx: Context = context();
        let expectedOwnerWallet: Address = contractAddress(self.walletInit(self.owner));
        require(ctx.sender == expectedOwnerWallet, "Untrusted issuance bounce sender");
        require(!self.mintable, "No issuance is awaiting rollback");
        require(msg.amount == VCOIN_MAX_SUPPLY, "Invalid bounced issuance amount");
        require(self.total_supply == VCOIN_MAX_SUPPLY, "Unexpected supply during issuance rollback");
        self.total_supply = 0;
        self.mintable = true;
    }
}
