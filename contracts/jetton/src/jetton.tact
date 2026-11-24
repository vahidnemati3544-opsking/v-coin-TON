import "./messages";

@interface("org.ton.jetton.master")
trait JettonMaster {
    total_supply: Int as coins;
    mintable: Bool;
    owner: Address;
    content: Cell;

    receive(msg: TokenBurnNotification) {
        let init: StateInit = self.walletInit(msg.sender);
        require(contractAddress(init) == sender(), "Invalid Jetton wallet");
        require(self.total_supply >= msg.amount, "Burn exceeds supply");
        self.total_supply = self.total_supply - msg.amount;
        if (msg.response_destination != null) {
            send(SendParameters{
                to: msg.response_destination!!,
                value: 0,
                bounce: false,
                mode: SendRemainingValue + SendIgnoreErrors,
                body: TokenExcesses{query_id: msg.query_id}.toCell()
            });
        }
    }

    receive(msg: ProvideWalletAddress) {
        require(context().value >= ton("0.0061"), "Insufficient gas");
        let init: StateInit = self.walletInit(msg.owner_address);
        let addr: Address = contractAddress(init);
        let ownerCell: Cell = beginCell().storeAddress(msg.owner_address).endCell();
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            body: TakeWalletAddress{
                query_id: msg.query_id,
                wallet_address: addr,
                owner_address: ownerCell.asSlice()
            }.toCell()
        });
    }

    virtual fun walletInit(ownerAddress: Address): StateInit {
        return initOf VCoinJettonWallet(ownerAddress, myAddress());
    }

    fun mintTo(receiver: Address, amount: Int, response: Address, stageQueryId: Int) {
        require(self.mintable, "Minting permanently disabled");
        require(amount > 0, "Mint amount must be positive");
        self.total_supply = self.total_supply + amount;
        let init: StateInit = self.walletInit(receiver);
        send(SendParameters{
            to: contractAddress(init),
            value: ton("0.1"),
            bounce: true,
            mode: SendPayGasSeparately,
            body: TokenTransferInternal{
                query_id: stageQueryId,
                amount: amount,
                from: myAddress(),
                response_destination: response,
                forward_ton_amount: 0,
                forward_payload: beginCell().endCell().asSlice()
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    get fun get_jetton_data(): JettonData {
        return JettonData{
            total_supply: self.total_supply,
            mintable: self.mintable,
            owner: self.owner,
            content: self.content,
            wallet_code: self.walletInit(self.owner).code
        };
    }

    get fun get_wallet_address(owner_address: Address): Address {
        return contractAddress(self.walletInit(owner_address));
    }
}

@interface("org.ton.jetton.wallet")
contract VCoinJettonWallet {
    const minTonsForStorage: Int = ton("0.019");
    const gasConsumption: Int = ton("0.013");
    balance: Int as coins = 0;
    owner: Address;
    master: Address;

    init(owner: Address, master: Address) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
    }

    receive(msg: TokenTransfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Only wallet owner may transfer");
        require(msg.amount > 0 && self.balance >= msg.amount, "Insufficient jetton balance");
        let fee: Int = ctx.readForwardFee();
        require(ctx.value > (2 * fee + 2 * self.gasConsumption + self.minTonsForStorage + msg.forward_ton_amount), "Insufficient TON for transfer");
        self.balance = self.balance - msg.amount;
        let init: StateInit = initOf VCoinJettonWallet(msg.destination, self.master);
        send(SendParameters{
            to: contractAddress(init),
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: TokenTransferInternal{
                query_id: msg.query_id,
                amount: msg.amount,
                from: self.owner,
                response_destination: msg.response_destination,
                forward_ton_amount: msg.forward_ton_amount,
                forward_payload: msg.forward_payload
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    receive(msg: TokenTransferInternal) {
        let ctx: Context = context();
        if (ctx.sender != self.master) {
            let source: StateInit = initOf VCoinJettonWallet(msg.from, self.master);
            require(contractAddress(source) == ctx.sender, "Untrusted Jetton wallet");
        }
        require(msg.amount > 0, "Transfer amount must be positive");
        self.balance = self.balance + msg.amount;
        let remaining: Int = ctx.value - self.gasConsumption;
        if (msg.forward_ton_amount > 0) {
            require(remaining >= msg.forward_ton_amount + ctx.readForwardFee(), "Insufficient notification TON");
            remaining = remaining - msg.forward_ton_amount - ctx.readForwardFee();
            send(SendParameters{
                to: self.owner,
                value: msg.forward_ton_amount,
                mode: SendPayGasSeparately,
                bounce: false,
                body: TokenNotification{
                    query_id: msg.query_id,
                    amount: msg.amount,
                    from: msg.from,
                    forward_payload: msg.forward_payload
                }.toCell()
            });
        }
        if (msg.response_destination != null && remaining > 0) {
            send(SendParameters{
                to: msg.response_destination!!,
                value: remaining,
                mode: SendIgnoreErrors,
                bounce: false,
                body: TokenExcesses{query_id: msg.query_id}.toCell()
            });
        }
    }

    receive(msg: TokenBurn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Only wallet owner may burn");
        require(msg.amount > 0 && self.balance >= msg.amount, "Insufficient jetton balance");
        require(ctx.value > ctx.readForwardFee() + 2 * self.gasConsumption + self.minTonsForStorage, "Insufficient TON for burn");
        self.balance = self.balance - msg.amount;
        send(SendParameters{
            to: self.master,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: TokenBurnNotification{
                query_id: msg.query_id,
                amount: msg.amount,
                sender: self.owner,
                response_destination: msg.response_destination
            }.toCell()
        });
    }

    bounced(msg: bounced<TokenTransferInternal>) { self.balance = self.balance + msg.amount; }
    bounced(msg: bounced<TokenBurnNotification>) { self.balance = self.balance + msg.amount; }

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{
            balance: self.balance,
            owner: self.owner,
            master: self.master,
            code: initOf VCoinJettonWallet(self.owner, self.master).code
        };
    }
}
