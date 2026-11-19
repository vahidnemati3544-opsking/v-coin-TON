struct VcoinWalletStorage {
    jettonBalance: coins
    ownerAddress: address
    minterAddress: address
    genesisCredited: bool
    genesisQueryId: uint64
    genesisAmount: coins
}

fun VcoinWalletStorage.load(): VcoinWalletStorage {
    return VcoinWalletStorage.fromCell(contract.getData());
}

fun VcoinWalletStorage.save(self) {
    contract.setData(self.toCell());
}

struct VcoinWalletDataReply {
    jettonBalance: coins
    ownerAddress: address
    minterAddress: address
    jettonWalletCode: cell
    genesisCredited: bool
    genesisQueryId: uint64
    genesisAmount: coins
}
