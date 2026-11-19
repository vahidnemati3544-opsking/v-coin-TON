import "storage"

struct VcoinGenesisSlot {
    recipient: address
    amount: coins
    status: uint8
    queryId: uint64
}

struct VcoinMinterStorage {
    totalSupply: coins
    metadata: cell
    genesisCoordinator: address
    completedSlots: uint8
    founderSlot: Cell<VcoinGenesisSlot>
    miningSlot: Cell<VcoinGenesisSlot>
    treasurySlot: Cell<VcoinGenesisSlot>
    liquiditySlot: Cell<VcoinGenesisSlot>
    ecosystemSlot: Cell<VcoinGenesisSlot>
}

fun VcoinMinterStorage.load(): VcoinMinterStorage {
    return VcoinMinterStorage.fromCell(contract.getData());
}

fun VcoinMinterStorage.save(self) {
    contract.setData(self.toCell());
}

struct VcoinJettonDataReply {
    totalSupply: int
    mintable: bool
    adminAddress: address?
    jettonContent: Cell<OnchainMetadataReply>
    jettonWalletCode: cell
}

struct VcoinGenesisStatusReply {
    totalSupply: coins
    completedSlots: uint8
    genesisComplete: bool
}
