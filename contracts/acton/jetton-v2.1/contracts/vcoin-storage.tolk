import "storage"

struct VcoinPendingMint {
    allocationId: uint8
    recipient: address
    amount: coins
    queryId: uint64
}

struct VcoinMinterStorage {
    totalSupply: coins
    adminAddress: address?
    metadata: cell
    treasuryOwner: address
    lifetimeIssued: coins
    founderStatus: uint8
    miningStatus: uint8
    treasuryStatus: uint8
    liquidityStatus: uint8
    ecosystemStatus: uint8
    finalized: bool
}

fun VcoinMinterStorage.load(): VcoinMinterStorage {
    return VcoinMinterStorage.fromCell(contract.getData());
}

fun VcoinMinterStorage.save(self) {
    contract.setData(self.toCell());
}
