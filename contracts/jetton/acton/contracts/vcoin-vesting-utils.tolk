import "sharding"
import "vcoin-vesting-storage"

fun calcDeployedVcoinFounderVesting(
    storage: VcoinFounderVestingStorage,
    vestingCode: cell,
    closeTo: address,
): AutoDeployAddress {
    return {
        workchain: MY_WORKCHAIN,
        stateInit: { code: vestingCode, data: storage.toCell() },
        toShard: { fixedPrefixLength: SHARD_DEPTH, closeTo },
    };
}
