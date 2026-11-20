import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"
import "@acton/types/message"
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

get fun `test founder vesting release success failure rollback and retry`() {
    testing.setNow(1000);
    val (minter, admin, _, _) = setupVcoinMinter(false);

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

    val founderEscrowAddress = minter.getVcoinFounderEscrowAddress();
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

    val beneficiaryWallet = minter.getWalletAddress(FOUNDER);
    val escrowJettonWallet = minter.getWalletAddress(founderEscrowAddress!);

    testing.setNow(1000 + 126230400 / 2);
    val firstRelease = createMessage({
        bounce: true,
        value: grams("0.6"),
        dest: founderEscrowAddress!,
        body: ReleaseVestedVcoin { queryId: 80 },
    });
    testing.processSingleTraceStep(FOUNDER, firstRelease);
    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(0);

    val firstSuccessAck = createMessage({
        bounce: false,
        value: grams("0.1"),
        dest: founderEscrowAddress!,
        body: ReturnExcessesBack { queryId: 80 },
    });
    testing.processSingleTraceStep(beneficiaryWallet, firstSuccessAck);
    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(FOUNDER_AMOUNT / 2);

    testing.setNow(1000 + 126230400 * 3 / 4);
    val secondRelease = createMessage({
        bounce: true,
        value: grams("0.6"),
        dest: founderEscrowAddress!,
        body: ReleaseVestedVcoin { queryId: 81 },
    });
    testing.processSingleTraceStep(FOUNDER, secondRelease);

    val failedTransferAck = createMessage({
        bounce: false,
        value: grams("0.1"),
        dest: founderEscrowAddress!,
        body: VcoinTransferFailed {
            queryId: 81,
            jettonAmount: FOUNDER_AMOUNT / 4,
            ownerAddress: founderEscrowAddress!,
        },
    });
    testing.processSingleTraceStep(escrowJettonWallet, failedTransferAck);
    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(FOUNDER_AMOUNT / 2);

    val retryRelease = createMessage({
        bounce: true,
        value: grams("0.6"),
        dest: founderEscrowAddress!,
        body: ReleaseVestedVcoin { queryId: 82 },
    });
    testing.processSingleTraceStep(FOUNDER, retryRelease);

    val retrySuccessAck = createMessage({
        bounce: false,
        value: grams("0.1"),
        dest: founderEscrowAddress!,
        body: ReturnExcessesBack { queryId: 82 },
    });
    testing.processSingleTraceStep(beneficiaryWallet, retrySuccessAck);
    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(
        FOUNDER_AMOUNT * 3 / 4,
    );

    // A replayed query ID cannot release the same accrued amount twice.
    val replayRelease = createMessage({
        bounce: true,
        value: grams("0.6"),
        dest: founderEscrowAddress!,
        body: ReleaseVestedVcoin { queryId: 82 },
    });
    testing.processSingleTraceStep(FOUNDER, replayRelease);
    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(
        FOUNDER_AMOUNT * 3 / 4,
    );

    // Exercise the escrow's bounced AskToTransfer recovery path.
    testing.setNow(1000 + 126230400 * 7 / 8);
    val bouncedRelease = createMessage({
        bounce: true,
        value: grams("0.6"),
        dest: founderEscrowAddress!,
        body: ReleaseVestedVcoin { queryId: 83 },
    });
    val releaseTrace = testing.processSingleTraceStep(FOUNDER, bouncedRelease);
    val outgoingTransfer = releaseTrace.outMessages.at<AskToTransfer>(0);
    val outgoingBody = outgoingTransfer.loadBody();
    val bouncedBody = beginCell()
        .storeUint(0xffffffff, 32)
        .storeSlice(outgoingBody.toCell().beginParse())
        .endCell();
    val bouncedMessage = createMessage({
        bounce: false,
        value: grams("0.1"),
        dest: founderEscrowAddress!,
        body: bouncedBody,
    }).bounced();
    testing.processSingleTraceStep(escrowJettonWallet, bouncedMessage);
    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(
        FOUNDER_AMOUNT * 3 / 4,
    );

    // A new query ID succeeds after bounce recovery clears the pending release.
    val finalRetry = createMessage({
        bounce: true,
        value: grams("0.6"),
        dest: founderEscrowAddress!,
        body: ReleaseVestedVcoin { queryId: 84 },
    });
    testing.processSingleTraceStep(FOUNDER, finalRetry);
    val finalSuccessAck = createMessage({
        bounce: false,
        value: grams("0.1"),
        dest: founderEscrowAddress!,
        body: ReturnExcessesBack { queryId: 84 },
    });
    testing.processSingleTraceStep(beneficiaryWallet, finalSuccessAck);
    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(
        FOUNDER_AMOUNT * 7 / 8,
    );
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

get fun `test founder vesting release completes through actual VCOIN jetton wallets`() {
    testing.setNow(1000);
    val (minter, admin, _, _) = setupVcoinMinter(false);

    val configure = minter.sendConfigureVcoinEscrows(
        admin.address,
        90,
        1000,
        { value: grams("1.5"), bounce: true },
    );
    expect(configure).toHaveSuccessfulTx<ConfigureVcoinEscrows>({
        from: admin.address,
        to: minter.address,
    });

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
        91,
        grams("0.05"),
    );
    expect(founderMint).toHaveSuccessfulTx<MintNewJettons>({
        from: admin.address,
        to: minter.address,
    });
    expect(founderEscrow.getVcoinVestingDeposited()).toEqual(true);

    val escrowJettonWallet = VcoinJettonWallet.fromAddress(
        minter.getWalletAddress(founderEscrowAddress!),
    );
    val beneficiaryJettonWallet = VcoinJettonWallet.fromAddress(
        minter.getWalletAddress(FOUNDER),
    );

    testing.setNow(1000 + 126230400 / 2);
    val release = createMessage({
        bounce: true,
        value: grams("0.6"),
        dest: founderEscrowAddress!,
        body: ReleaseVestedVcoin { queryId: 92 },
    });

    // net.send executes the complete message chain:
    // Founder -> Escrow -> escrow Jetton wallet -> beneficiary Jetton wallet
    // -> ReturnExcessesBack -> Escrow.
    net.send(FOUNDER, release);

    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(
        FOUNDER_AMOUNT / 2,
    );
    expect(escrowJettonWallet.getWalletData().jettonBalance).toEqual(
        FOUNDER_AMOUNT / 2,
    );
    expect(beneficiaryJettonWallet.getWalletData().jettonBalance).toEqual(
        FOUNDER_AMOUNT / 2,
    );
}


get fun `test VCOIN wallet RichBounce restores escrow balance and delivers failure acknowledgement`() {
    testing.setNow(2000);
    val (minter, admin, _, _) = setupVcoinMinter(false);

    val configure = minter.sendConfigureVcoinEscrows(
        admin.address,
        100,
        2000,
        { value: grams("1.5"), bounce: true },
    );
    expect(configure).toHaveSuccessfulTx<ConfigureVcoinEscrows>({
        from: admin.address,
        to: minter.address,
    });

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
        101,
        grams("0.05"),
    );
    expect(founderMint).toHaveSuccessfulTx<MintNewJettons>({
        from: admin.address,
        to: minter.address,
    });

    val escrowJettonWallet = VcoinJettonWallet.fromAddress(
        minter.getWalletAddress(founderEscrowAddress!),
    );
    val balanceBefore = escrowJettonWallet.getWalletData().jettonBalance;

    testing.setNow(2000 + 126230400 / 2);
    val release = createMessage({
        bounce: true,
        value: grams("0.6"),
        dest: founderEscrowAddress!,
        body: ReleaseVestedVcoin { queryId: 102 },
    });
    val releaseResult = testing.processSingleTraceStep(FOUNDER, release);
    val askToTransfer = releaseResult.outMessages.at(0);

    // Execute the real VCOIN escrow-wallet transaction so its jetton balance
    // is debited and its pending transfer is established.
    val walletResult = testing.processSingleTraceStep(
        founderEscrowAddress!,
        askToTransfer,
    );
    val actualInternalTransfer = walletResult.outMessages.at(0);
    expect(escrowJettonWallet.getWalletData().jettonBalance).toEqual(
        balanceBefore - FOUNDER_AMOUNT / 2,
    );

    // Deliver the exact InternalTransferStep emitted by the VCOIN wallet.
    // Its destination is intentionally uninitialized, causing a real TVM bounce.
    testing.topUp(escrowJettonWallet.address, grams("1"));
    net.send(escrowJettonWallet.address, actualInternalTransfer);

    // The actual VCOIN wallet bounce handler restores tokens and sends
    // VcoinTransferFailed from the escrow's own derived Jetton wallet.
    expect(escrowJettonWallet.getWalletData().jettonBalance).toEqual(balanceBefore);
    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(0);

    // A fresh query succeeds after the failure acknowledgement cleared pending state.
    testing.setNow(2000 + 126230400 * 3 / 4);
    val retry = createMessage({
        bounce: true,
        value: grams("0.6"),
        dest: founderEscrowAddress!,
        body: ReleaseVestedVcoin { queryId: 103 },
    });
    net.send(FOUNDER, retry);
    expect(founderEscrow.getVcoinVestingReleasedAmount()).toEqual(
        FOUNDER_AMOUNT * 3 / 4,
    );
    expect(escrowJettonWallet.getWalletData().jettonBalance).toEqual(
        FOUNDER_AMOUNT / 4,
    );
}
