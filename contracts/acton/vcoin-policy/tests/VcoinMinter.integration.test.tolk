import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"
import "../../wrappers/VcoinMinter.gen"
import "../../wrappers/VcoinVestingEscrow.gen"
import "../../jetton-v2.1/contracts/messages"
import "../../jetton-v2.1/contracts/storage"
import "../../jetton-v2.1/contracts/vcoin-messages"
import "../../jetton-v2.1/contracts/vcoin-storage"
import "../../jetton-v2.1/wrappers/VcoinJettonWallet.gen"

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

fun setupVcoinMinter(configureEscrows: bool = true): (VcoinMinter, Treasury, Treasury, Treasury) {
    val admin = testing.treasury("vcoin-admin");
    val outsider = testing.treasury("vcoin-outsider");
    val treasury = testing.treasury("vcoin-treasury");
    val founderEscrow = testing.treasury("vcoin-founder-escrow");
    val miningEscrow = testing.treasury("vcoin-mining-escrow");
    val minter = VcoinMinter.fromStorage(VcoinMinterStorage {
        totalSupply: 0,
        adminAddress: admin.address,
        metadata: testMetadata(),
        treasuryOwner: treasury.address,
        escrowState: VcoinMinterEscrowState {
            founderEscrowOwner: configureEscrows ? founderEscrow.address : null,
            miningEscrowOwner: configureEscrows ? miningEscrow.address : null,
            founderEscrowReady: configureEscrows,
            miningEscrowReady: configureEscrows,
            escrowConfigQueryId: configureEscrows ? 1 : 0,
        }.toCell(),
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
    forwardTonAmount: coins = 0,
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
            forwardTonAmount,
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

get fun `test VCOIN minter blocks founder allocation until vesting escrow exists`() {
    val (minter, admin, _, _) = setupVcoinMinter();
    val directFounderMint = mintAllocation(minter, admin, FOUNDER, FOUNDER_AMOUNT, 11);
    expect(
        directFounderMint,
    ).toHaveFailedTx<MintNewJettons>({ from: admin.address, to: minter.address, exitCode: 72 });
    expect(minter.getJettonData().totalSupply).toEqual(0);
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

get fun `test VCOIN minter blocks founder and mining and cannot finalize incomplete allocations`() {
    val (minter, admin, _, treasury) = setupVcoinMinter();

    expect(
        mintAllocation(minter, admin, FOUNDER, FOUNDER_AMOUNT, 31),
    ).toHaveFailedTx<MintNewJettons>({ from: admin.address, to: minter.address, exitCode: 72 });
    expect(
        mintAllocation(minter, admin, MINING, MINING_AMOUNT, 32),
    ).toHaveFailedTx<MintNewJettons>({ from: admin.address, to: minter.address, exitCode: 72 });

    expect(
        mintAllocation(minter, admin, treasury.address, OTHER_AMOUNT, 33),
    ).toHaveSuccessfulTx<MintNewJettons>({ from: admin.address, to: minter.address });
    // One allocation per transaction is serialized until the wallet acknowledgement is processed.
    // This test deliberately leaves the remaining allocations unissued.
    expect(minter.getJettonData().totalSupply).toEqual(1000000000000000);
    val finalize = minter.sendDropMinterAdmin(
        admin.address,
        36,
        { value: grams("0.1"), bounce: true },
    );
    expect(
        finalize,
    ).toHaveFailedTx<DropMinterAdmin>({ from: admin.address, to: minter.address, exitCode: 72 });
    expect(minter.getJettonData().mintable).toEqual(true);
}

get fun `test VCOIN deploys both vesting escrows and confirms founder mint only after deposit`() {
    testing.setNow(1000);
    val (minter, admin, outsider, _) = setupVcoinMinter(false);

    val configure = minter.sendConfigureVcoinEscrows(
        admin.address,
        77,
        1000,
        { value: grams("1.5"), bounce: true },
    );
    expect(configure).toHaveSuccessfulTx<ConfigureVcoinEscrows>({
        from: admin.address,
        to: minter.address,
    });
    expect(minter.getVcoinEscrowsReady()).toEqual(true);

    val founderEscrowAddress = minter.getVcoinFounderEscrowAddress();
    expect(founderEscrowAddress).toBeNotNull();
    if (founderEscrowAddress == null) {
        return;
    }

    val founderEscrow = VcoinVestingEscrow.fromAddress(founderEscrowAddress!);
    val founderMint = mintAllocation(
        minter,
        admin,
        founderEscrowAddress!,
        FOUNDER_AMOUNT,
        78,
        grams("0.05"),
    );
    expect(founderMint).toHaveSuccessfulTx<MintNewJettons>({
        from: admin.address,
        to: minter.address,
    });
    expect(founderEscrow.getVcoinVestingDeposited()).toEqual(true);
    expect(minter.getVcoinFounderAllocationStatus()).toEqual(2);

    val miningEscrowAddress = minter.getVcoinMiningEscrowAddress();
    expect(miningEscrowAddress).toBeNotNull();
    if (miningEscrowAddress == null) {
        return;
    }
    val miningEscrow = VcoinVestingEscrow.fromAddress(miningEscrowAddress!);
    val miningMint = mintAllocation(
        minter,
        admin,
        miningEscrowAddress!,
        MINING_AMOUNT,
        79,
        grams("0.05"),
    );
    expect(miningMint).toHaveSuccessfulTx<MintNewJettons>({
        from: admin.address,
        to: minter.address,
    });
    expect(miningEscrow.getVcoinVestingDeposited()).toEqual(true);
    expect(minter.getVcoinMiningAllocationStatus()).toEqual(2);

    val unauthorizedRelease = founderEscrow.sendReleaseVestedVcoin(
        outsider.address,
        80,
        { value: grams("0.6"), bounce: true },
    );
    expect(
        unauthorizedRelease,
    ).toHaveFailedTx<ReleaseVestedVcoin>({
        from: outsider.address,
        to: founderEscrow.address,
        exitCode: 73,
    });
}
