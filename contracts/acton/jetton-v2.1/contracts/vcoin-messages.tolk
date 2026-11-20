struct (0x56434d41) VcoinMintAccepted {
    queryId: uint64
    jettonAmount: coins
    ownerAddress: address
}

struct (0x56434553) ConfigureVcoinEscrows {
    queryId: uint64
    founderEscrowOwner: address
    miningEscrowOwner: address
}
