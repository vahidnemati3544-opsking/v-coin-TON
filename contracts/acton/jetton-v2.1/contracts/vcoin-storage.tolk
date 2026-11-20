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
    founderEscrowOwner: address?
    miningEscrowOwner: address?
    founderEscrowReady: bool
    miningEscrowReady: bool
    escrowConfigQueryId: uint64
    lifetimeIssued: coins
    founderStatus: uint8
    miningStatus: uint8
    treasuryStatus: uint8
    liquidityStatus: uint8
    ecosystemStatus: uint8
    pendingAllocation: uint8
    pendingQueryId: uint64
    finalized: bool
}

fun VcoinMinterStorage.load(): VcoinMinterStorage {
    return VcoinMinterStorage.fromCell(contract.getData());
}

fun VcoinMinterStorage.save(self) {
    contract.setData(self.toCell());
}

struct VcoinVestingEscrowStorage {
    vestingKind: uint8
    minterAddress: address
    beneficiaryAddress: address
    controllerAddress: address
    allocationAmount: coins
    startTime: uint32
    duration: uint32
    configQueryId: uint64
    deposited: bool
    releasedAmount: coins
}
