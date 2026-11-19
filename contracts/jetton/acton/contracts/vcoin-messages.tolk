struct (0x56434741) VcoinGenesisCreditAck {
    queryId: uint64
    jettonAmount: coins
    ownerAddress: address
}

struct (0x56434752) VcoinGenesisSlotRequest {
    slotId: uint8
}

struct (0x56434753) StartVcoinGenesis {
    masterAddress: address
}
