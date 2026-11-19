struct VcoinFounderVestingConfig {
    beneficiary: address
    activationController: address
    masterAddress: address?
}

struct VcoinFounderVestingState {
    startTimestamp: uint64
    releasedTranches: uint8
    pendingTranches: uint8
    pendingQueryId: uint64
    pendingAmount: coins
    nextQueryId: uint64
}

struct VcoinFounderVestingStorage {
    config: Cell<VcoinFounderVestingConfig>
    state: Cell<VcoinFounderVestingState>
}

fun VcoinFounderVestingStorage.load(): VcoinFounderVestingStorage {
    return VcoinFounderVestingStorage.fromCell(contract.getData());
}

fun VcoinFounderVestingStorage.save(self) {
    contract.setData(self.toCell());
}

struct VcoinFounderVestingStatusReply {
    beneficiary: address
    activationController: address
    masterAddress: address?
    startTimestamp: uint64
    releasedTranches: uint8
    pendingTranches: uint8
    pendingQueryId: uint64
    pendingAmount: coins
    claimableTranches: uint8
    claimableAmount: coins
}
