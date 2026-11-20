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
    lifetimeIssued: coins
    founderIssued: coins
    miningIssued: coins
    treasuryIssued: coins
    liquidityIssued: coins
    ecosystemIssued: coins
    founderStatus: uint8
    miningStatus: uint8
    treasuryStatus: uint8
    liquidityStatus: uint8
    ecosystemStatus: uint8
    founderQueryId: uint64
    miningQueryId: uint64
    treasuryQueryId: uint64
    liquidityQueryId: uint64
    ecosystemQueryId: uint64
    pendingMints: map<uint64, cell>
    finalized: bool
}

fun VcoinMinterStorage.load(): VcoinMinterStorage {
    return VcoinMinterStorage.fromCell(contract.getData());
}

fun VcoinMinterStorage.save(self) {
    contract.setData(self.toCell());
}
