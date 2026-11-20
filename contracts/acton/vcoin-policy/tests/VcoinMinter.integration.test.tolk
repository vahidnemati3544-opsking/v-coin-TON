import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"
import "../../jetton-v2.1/contracts/messages"
import "../../jetton-v2.1/contracts/storage"
import "../../jetton-v2.1/contracts/vcoin-storage"
import "../../jetton-v2.1/wrappers/VcoinJettonWallet.gen"
import "../../jetton-v2.1/wrappers/VcoinMinter.gen"

const FOUNDER = address("UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy")
const MINING = address("UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0")
const LIQUIDITY = address("UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn")
const ECOSYSTEM = address("UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE")

const FOUNDER_AMOUNT = 2000000000000000
const MINING_AMOUNT = 5000000000000000
const OTHER_AMOUNT = 1000000000000000
const TOTAL_AMOUNT = 10000000000000000

fun testMetadata(): cell {
    var metadata: OnchainMetadataReply = { contentDict: [] };
    metadata
        .contentDict
        .set(
            "uri".sha256(),
            SnakeDataReply { string: "https://vcoin.example/metadata.json" }.toCell(),
        );
    return metadata.toCell();
}

fun setupVcoinMinter(): (VcoinMinter, Treasury, Treasury, Treasury) {
    val admin = testing.treasury("vcoin-admin");
    val outsider = testing.treasury("vcoin-outsider");
    val treasury = testing.treasury("vcoin-treasury");
    val minter = VcoinMinter.fromStorage(VcoinMinterStorage {
        totalSupply: 0,
        adminAddress: admin.address,
        metadata: testMetadata(),
        treasuryOwner: treasury.address,
        lifetimeIssued: 0,
        founderStatus: 0,
        miningStatus: 0,
        treasuryStatus: 0,
        liquidityStatus: 0,
        ecosystemStatus: 0,
        pendingAllocation: 0,
        pendingQueryId: 0,
        finalized: false,
    });
    val deploy = minter.deploy(admin.address, { value: grams("10"), bounce: false });
    expect(deploy).toHaveSuccessfulDeploy({ to: minter.address });
    return (minter, admin, outsider, treasury);
}

fun mintAllocation(
    minter: VcoinMinter,
    admin: Treasury,
    recipient: address,
    amount: coins,
    queryId: uint64,
): SendResultList {
    val forwardPayload = beginCell().storeUint(0, 1).toSlice();
    return minter.sendMintNewJettons(
        admin.address,
        queryId,
        recipient,
        grams("0.5"),
        InternalTransferStep {
            queryId,
            jettonAmount: amount,
            transferInitiator: null,
            sendExcessesTo: null,
            forwardTonAmount: 0,
            forwardPayload,
        },
        { value: grams("2"), bounce: true },
    );
}

get fun `test VCOIN minter rejects mint from non-admin`() {
    val (minter, _, outsider, _) = setupVcoinMinter();
    val result = mintAllocation(minter, outsider, FOUNDER, FOUNDER_AMOUNT, 1);
    expect(result).toHaveFailedTx<MintNewJettons>({
        from: outsider.address,
        to: minter.address,
        exitCode: 73,
    });
}

get fun `test VCOIN minter rejects a sixth destination`() {
    val (minter, admin, _, _) = setupVcoinMinter();
    val outsider = testing.treasury("vcoin-sixth-destination");
    val result = mintAllocation(minter, admin, outsider.address, 1, 2);
    expect(result).toHaveFailedTx<MintNewJettons>({
        from: admin.address,
        to: minter.address,
        exitCode: 72,
    });
    expect(minter.getJettonData().totalSupply).toEqual(0);
}

get fun `test VCOIN minter mints exact founder allocation and rejects a second mint`() {
    val (minter, admin, _, _) = setupVcoinMinter();
    val first = mintAllocation(minter, admin, FOUNDER, FOUNDER_AMOUNT, 11);
    expect(first).toHaveSuccessfulTx<MintNewJettons>({ from: admin.address, to: minter.address });
    val founderWallet = VcoinJettonWallet { address: minter.getWalletAddress(FOUNDER) };
    expect(founderWallet.getWalletData().jettonBalance).toEqual(FOUNDER_AMOUNT);
    expect(minter.getJettonData().totalSupply).toEqual(FOUNDER_AMOUNT);

    val second = mintAllocation(minter, admin, FOUNDER, FOUNDER_AMOUNT, 12);
    expect(
        second,
    ).toHaveFailedTx<MintNewJettons>({ from: admin.address, to: minter.address, exitCode: 72 });
    expect(minter.getJettonData().totalSupply).toEqual(FOUNDER_AMOUNT);
}

get fun `test VCOIN minter rejects partial and over-allocation mints`() {
    val (minter, admin, _, _) = setupVcoinMinter();
    val partial = mintAllocation(minter, admin, FOUNDER, FOUNDER_AMOUNT - 1, 21);
    expect(
        partial,
    ).toHaveFailedTx<MintNewJettons>({ from: admin.address, to: minter.address, exitCode: 72 });
    val over = mintAllocation(minter, admin, FOUNDER, FOUNDER_AMOUNT + 1, 22);
    expect(
        over,
    ).toHaveFailedTx<MintNewJettons>({ from: admin.address, to: minter.address, exitCode: 72 });
    expect(minter.getJettonData().totalSupply).toEqual(0);
}

get fun `test VCOIN minter finalizes only after all five exact allocations are credited`() {
    val (minter, admin, _, treasury) = setupVcoinMinter();

    val earlyFinalize = minter.sendDropMinterAdmin(
        admin.address,
        30,
        { value: grams("0.1"), bounce: true },
    );
    expect(
        earlyFinalize,
    ).toHaveFailedTx<DropMinterAdmin>({ from: admin.address, to: minter.address, exitCode: 72 });

    expect(
        mintAllocation(minter, admin, FOUNDER, FOUNDER_AMOUNT, 31),
    ).toHaveSuccessfulTx<MintNewJettons>({ from: admin.address, to: minter.address });
    expect(
        mintAllocation(minter, admin, MINING, MINING_AMOUNT, 32),
    ).toHaveSuccessfulTx<MintNewJettons>({ from: admin.address, to: minter.address });
    expect(
        mintAllocation(minter, admin, treasury.address, OTHER_AMOUNT, 33),
    ).toHaveSuccessfulTx<MintNewJettons>({ from: admin.address, to: minter.address });
    expect(
        mintAllocation(minter, admin, LIQUIDITY, OTHER_AMOUNT, 34),
    ).toHaveSuccessfulTx<MintNewJettons>({ from: admin.address, to: minter.address });
    expect(
        mintAllocation(minter, admin, ECOSYSTEM, OTHER_AMOUNT, 35),
    ).toHaveSuccessfulTx<MintNewJettons>({ from: admin.address, to: minter.address });

    expect(minter.getJettonData().totalSupply).toEqual(TOTAL_AMOUNT);
    val finalize = minter.sendDropMinterAdmin(
        admin.address,
        36,
        { value: grams("0.1"), bounce: true },
    );
    expect(
        finalize,
    ).toHaveSuccessfulTx<DropMinterAdmin>({ from: admin.address, to: minter.address });
    expect(minter.getJettonData().mintable).toEqual(false);
    expect(minter.getJettonData().adminAddress).toEqual(null);
}
