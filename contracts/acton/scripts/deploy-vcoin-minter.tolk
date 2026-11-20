import "@acton/io"
import "@acton/emulation/network"
import "@acton/emulation/scripts"
import "../jetton-v2.1/contracts/storage"
import "../jetton-v2.1/contracts/vcoin-storage"
import "../jetton-v2.1/wrappers/VcoinMinter.gen"

const VCOIN_FOUNDER = address("UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy")
const VCOIN_TREASURY = address("UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ")
const VCOIN_LIQUIDITY = address("UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn")
const VCOIN_ECOSYSTEM = address("UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE")
const VCOIN_MINING = address("UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0")

fun initialMetadata(): cell {
    var metadata: OnchainMetadataReply = { contentDict: [] };
    metadata
        .contentDict
        .set(
            "name".sha256(),
            SnakeDataReply { string: "V COIN" }.toCell(),
        );
    metadata
        .contentDict
        .set(
            "symbol".sha256(),
            SnakeDataReply { string: "VCOIN" }.toCell(),
        );
    metadata
        .contentDict
        .set(
            "decimals".sha256(),
            SnakeDataReply { string: "6" }.toCell(),
        );
    metadata
        .contentDict
        .set(
            "description".sha256(),
            SnakeDataReply { string: "V COIN digital asset on TON" }.toCell(),
        );
    return metadata.toCell();
}

fun main() {
    val deployer = scripts.wallet("deployer");
    if (net.isBroadcasting() && deployer.address != VCOIN_FOUNDER) {
        println("STOP: Testnet/Mainnet deployer must be the recorded Founder wallet.");
        return;
    }

    val escrowState = VcoinMinterEscrowState {
        founderEscrowOwner: null,
        miningEscrowOwner: null,
        founderEscrowReady: false,
        miningEscrowReady: false,
        escrowConfigQueryId: 0,
    };
    val minterStorage = VcoinMinterStorage {
        totalSupply: 0,
        adminAddress: deployer.address,
        metadata: initialMetadata(),
        treasuryOwner: VCOIN_TREASURY,
        escrowState: escrowState.toCell(),
        lifetimeIssued: 0,
        founderStatus: 0,
        miningStatus: 0,
        treasuryStatus: 0,
        liquidityStatus: 0,
        ecosystemStatus: 0,
        pendingAllocation: 0,
        pendingQueryId: 0,
        finalized: false,
    };

    val minter = VcoinMinter.fromStorage(minterStorage);
    println("VCOIN minter deterministic address: {}", minter.address);
    println("Network broadcast mode: {}", net.isBroadcasting());
    println("Initial supply: 0 / 10000000000000000 base units");
    println("Metadata: V COIN / VCOIN / 6 decimals");

    val result = minter.deploy(deployer.address, { value: grams("1.0"), bounce: false });
    val tx = result.waitForFirstTransaction();
    if (tx == null) {
        println("Deployment transaction was not confirmed. No success is claimed.");
        return;
    }

    println("VCOIN minter deployment transaction confirmed.");
    println("VCOIN master address: {}", minter.address);
    println("Total supply after deployment: {}", minter.getJettonData().totalSupply);
    println("Mintable before allocation issuance: {}", minter.getJettonData().mintable);
}
