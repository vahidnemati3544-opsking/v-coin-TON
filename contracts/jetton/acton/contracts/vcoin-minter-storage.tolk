import "storage"

struct VcoinGenesisSlot {
    recipient: address
    amount: coins
    status: uint8
    queryId: uint64
}

struct VcoinGenesisCoreSlots {
    founderSlot: Cell<VcoinGenesisSlot>
    miningSlot: Cell<VcoinGenesisSlot>
    treasurySlot: Cell<VcoinGenesisSlot>
}

struct VcoinGenesisExtraSlots {
    liquiditySlot: Cell<VcoinGenesisSlot>
    ecosystemSlot: Cell<VcoinGenesisSlot>
}

struct VcoinMinterStorage {
    totalSupply: coins
    genesisIssued: coins
    metadata: cell
    genesisCoordinator: address
    completedSlots: uint8
    coreSlots: Cell<VcoinGenesisCoreSlots>
    extraSlots: Cell<VcoinGenesisExtraSlots>
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
    genesisIssued: coins
    completedSlots: uint8
    genesisComplete: bool
}
