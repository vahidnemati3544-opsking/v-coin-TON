import "sharding"
import "vcoin-storage"

fun calcDeployedVcoinJettonWallet(
    ownerAddress: address,
    minterAddress: address,
    jettonWalletCode: cell,
): AutoDeployAddress {
    val emptyWalletStorage: VcoinWalletStorage = {
        jettonBalance: 0,
        ownerAddress,
        minterAddress,
        genesisCredited: false,
        genesisQueryId: 0,
        genesisAmount: 0,
    };

    return {
        workchain: MY_WORKCHAIN,
        stateInit: { code: jettonWalletCode, data: emptyWalletStorage.toCell() },
        toShard: { fixedPrefixLength: SHARD_DEPTH, closeTo: ownerAddress },
    };
}

fun calcAddressOfVcoinJettonWallet(
    ownerAddress: address,
    minterAddress: address,
    jettonWalletCode: cell,
): address {
    val wallet = calcDeployedVcoinJettonWallet(ownerAddress, minterAddress, jettonWalletCode);
    return wallet.calculateAddress();
}

