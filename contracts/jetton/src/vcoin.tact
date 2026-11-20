import "./jetton";

const VCOIN_MAX_SUPPLY: Int = 10000000000000000; // 10,000,000,000 tokens * 10^6

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

    receive(msg: VCoinMint) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Unauthorized mint authority");
        require(self.mintable, "Minting permanently disabled");
        require(msg.amount > 0, "Mint amount must be positive");
        require(self.total_supply + msg.amount <= VCOIN_MAX_SUPPLY, "VCOIN maximum supply exceeded");
        self.mintTo(msg.receiver, msg.amount, self.owner);
        if (self.total_supply == VCOIN_MAX_SUPPLY) {
            self.mintable = false;
        }
    }
}