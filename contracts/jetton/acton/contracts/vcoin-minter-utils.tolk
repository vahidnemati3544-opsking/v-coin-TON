import "sharding"
import "vcoin-minter-storage"

fun calcDeployedVcoinJettonMinter(
    storage: VcoinMinterStorage,
    minterCode: cell,
    closeTo: address,
): AutoDeployAddress {
    return {
        workchain: MY_WORKCHAIN,
        stateInit: { code: minterCode, data: storage.toCell() },
        toShard: { fixedPrefixLength: SHARD_DEPTH, closeTo },
    };
}
