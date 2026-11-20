struct (0x56434d41) VcoinMintAccepted {
    queryId: uint64
    jettonAmount: coins
    ownerAddress: address
}

struct (0x56434553) ConfigureVcoinEscrows {
    queryId: uint64
    startTime: uint32
}

struct (0x56435244) VcoinVestingEscrowReady {
    queryId: uint64
    vestingKind: uint8
    escrowAddress: address
}

struct (0x56434641) VcoinTransferFailed {
    queryId: uint64
    jettonAmount: coins
    ownerAddress: address
}

struct (0x56434450) VcoinEscrowDepositAccepted {
    queryId: uint64
    vestingKind: uint8
    jettonAmount: coins
    escrowAddress: address
}
