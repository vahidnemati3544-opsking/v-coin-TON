struct (0x5643534d) SetVcoinVestingMaster {
    masterAddress: address
}

struct (0x56434156) ActivateVcoinVesting {}

struct (0x56435256) ReleaseVcoinVesting {}

struct (0x56435246) RefreshVcoinVestingWalletAddresses {}

struct (0x0f8a7ea5) VcoinVestingAskToTransferBounce {
    queryId: uint64
    jettonAmount: coins
}

struct (0x2c76b973) VcoinVestingRequestWalletAddressBounce {
    queryId: uint64
}
