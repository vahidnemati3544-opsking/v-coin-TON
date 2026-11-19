import "@acton/build"
import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"
import "@contracts/messages"
import "@contracts/vcoin-genesis-config"
import "@contracts/vcoin-messages"
import "@contracts/vcoin-minter-storage"
import "@contracts/vcoin-minter-utils"
import "@contracts/vcoin-vesting-calendar"
import "@contracts/vcoin-vesting-messages"
import "@contracts/vcoin-vesting-storage"
import "@contracts/vcoin-vesting-utils"
import "@wrappers/VcoinFounderVesting.gen"
import "@wrappers/VcoinGenesisCoordinator.gen"
import "@wrappers/VcoinJettonMinter.gen"
import "@wrappers/VcoinJettonWallet.gen"
import "test-utils"

struct VcoinFounderVestingTestContext {
    vesting: VcoinFounderVesting
    minter: VcoinJettonMinter
    coordinator: VcoinGenesisCoordinator
    beneficiary: Treasury
    activationController: Treasury
    caller: Treasury
}

fun makeVcoinVestingGenesisSlot(recipient: address, amount: coins): Cell<VcoinGenesisSlot> {
    return VcoinGenesisSlot {
        recipient,
        amount,
        status: 0,
        queryId: 0,
    }.toCell();
}

fun setupVcoinFounderVestingTest(): VcoinFounderVestingTestContext {
    val deployer = testing.treasury("vcoin-vesting-deployer");
    val activationController = testing.treasury("vcoin-vesting-controller");
    val beneficiary = testing.treasury("vcoin-vesting-beneficiary");
    val caller = testing.treasury("vcoin-vesting-caller");
    val mining = testing.treasury("vcoin-vesting-mining");
    val treasury = testing.treasury("vcoin-vesting-treasury");
    val liquidity = testing.treasury("vcoin-vesting-liquidity");
    val ecosystem = testing.treasury("vcoin-vesting-ecosystem");

    val vestingStorage = VcoinFounderVestingStorage {
        config: VcoinFounderVestingConfig {
            beneficiary: beneficiary.address,
            activationController: activationController.address,
            wallets: VcoinFounderVestingWalletConfig {
                masterAddress: null,
                ownWalletAddress: null,
                beneficiaryWalletAddress: null,
            }.toCell(),
        }.toCell(),
        state: VcoinFounderVestingState {
            startTimestamp: 0,
            releasedTranches: 0,
            pendingTranches: 0,
            pendingQueryId: 0,
            pendingAmount: 0,
            nextQueryId: 1,
        }.toCell(),
    };
    val vestingInit = calcDeployedVcoinFounderVesting(
        vestingStorage,
        build("VcoinFounderVesting"),
        deployer.address,
    );
    val vesting = VcoinFounderVesting { address: vestingInit.calculateAddress() };
    val vestingDeploy = net.send(
        deployer.address,
        createMessage({
            bounce: false,
            value: grams("2"),
            dest: vestingInit,
            body: TopUpTons {},
        }),
    );
    expect(vestingDeploy).toHaveSuccessfulDeploy({ to: vesting.address });

    val coordinatorInit = calcDeployedVcoinGenesisCoordinator(
        build("VcoinGenesisCoordinator"),
        deployer.address,
    );
    val coordinator = VcoinGenesisCoordinator {
        address: coordinatorInit.calculateAddress(),
    };
    val coordinatorDeploy = net.send(
        deployer.address,
        createMessage({
            bounce: false,
            value: grams("1"),
            dest: coordinatorInit,
            body: TopUpTons {},
        }),
    );
    expect(coordinatorDeploy).toHaveSuccessfulDeploy({ to: coordinator.address });

    val coreSlots = VcoinGenesisCoreSlots {
        founderSlot: makeVcoinVestingGenesisSlot(
            vesting.address,
            VCOIN_FOUNDER_ALLOCATION_BASE_UNITS,
        ),
        miningSlot: makeVcoinVestingGenesisSlot(
            mining.address,
            VCOIN_MINING_RESERVE_BASE_UNITS,
        ),
        treasurySlot: makeVcoinVestingGenesisSlot(
            treasury.address,
            VCOIN_TREASURY_ALLOCATION_BASE_UNITS,
        ),
    }.toCell();
    val extraSlots = VcoinGenesisExtraSlots {
        liquiditySlot: makeVcoinVestingGenesisSlot(
            liquidity.address,
            VCOIN_LIQUIDITY_ALLOCATION_BASE_UNITS,
        ),
        ecosystemSlot: makeVcoinVestingGenesisSlot(
            ecosystem.address,
            VCOIN_ECOSYSTEM_ALLOCATION_BASE_UNITS,
        ),
    }.toCell();
    val minterStorage = VcoinMinterStorage {
        totalSupply: 0,
        genesisIssued: 0,
        metadata: buildTestMetadata("vcoin-founder-vesting-test"),
        genesisCoordinator: coordinator.address,
        completedSlots: 0,
        coreSlots,
        extraSlots,
    };
    val minterInit = calcDeployedVcoinJettonMinter(
        minterStorage,
        build("VcoinJettonMinter"),
        coordinator.address,
    );
    val minter = VcoinJettonMinter { address: minterInit.calculateAddress() };
    val minterDeploy = net.send(
        deployer.address,
        createMessage({
            bounce: false,
            value: grams("10"),
            dest: minterInit,
            body: TopUpTons {},
        }),
    );
    expect(minterDeploy).toHaveSuccessfulDeploy({ to: minter.address });

    return {
        vesting,
        minter,
        coordinator,
        beneficiary,
        activationController,
        caller,
    };
}

fun configureVcoinFounderVesting(ctx: VcoinFounderVestingTestContext) {
    val setMaster = net.send(
        ctx.activationController.address,
        createMessage({
            bounce: true,
            value: grams("0.5"),
            dest: ctx.vesting.address,
            body: SetVcoinVestingMaster { masterAddress: ctx.minter.address },
        }),
    );
    expect(setMaster).toHaveSuccessfulTx<SetVcoinVestingMaster>({
        from: ctx.activationController.address,
        to: ctx.vesting.address,
    });
    expect(ctx.vesting.getVestingWalletAddress()).toEqual(
        ctx.minter.getWalletAddress(ctx.vesting.address),
    );
    expect(ctx.vesting.getBeneficiaryWalletAddress()).toEqual(
        ctx.minter.getWalletAddress(ctx.beneficiary.address),
    );
}

fun startVcoinFounderGenesis(ctx: VcoinFounderVestingTestContext): SendResultList {
    return net.send(
        ctx.caller.address,
        createMessage({
            bounce: true,
            value: grams("8"),
            dest: ctx.coordinator.address,
            body: StartVcoinGenesis { masterAddress: ctx.minter.address },
        }),
    );
}

fun releaseVcoinFounderVesting(ctx: VcoinFounderVestingTestContext): SendResultList {
    return net.send(
        ctx.caller.address,
        createMessage({
            bounce: true,
            value: grams("1.2"),
            dest: ctx.vesting.address,
            body: ReleaseVcoinVesting {},
        }),
    );
}

get fun `test VCOIN founder vesting recovers a bounced claim and releases the full 48-month allocation`() {
    val ctx = setupVcoinFounderVestingTest();
    configureVcoinFounderVesting(ctx);

    val startTimestamp = testing.getNow();
    testing.setNow(startTimestamp);
    val activate = net.send(
        ctx.activationController.address,
        createMessage({
            bounce: true,
            value: grams("0.2"),
            dest: ctx.vesting.address,
            body: ActivateVcoinVesting {},
        }),
    );
    expect(activate).toHaveSuccessfulTx<ActivateVcoinVesting>({
        from: ctx.activationController.address,
        to: ctx.vesting.address,
    });
    expect(ctx.vesting.getVestingStatus().startTimestamp).toEqual(startTimestamp);

    val firstDue = vcoinMonthlyVestingDueTimestamp(startTimestamp as int, 1);
    testing.setNow(firstDue as uint32);
    val prematureRelease = releaseVcoinFounderVesting(ctx);
    expect(prematureRelease).toHaveSuccessfulTx<ReleaseVcoinVesting>({
        from: ctx.caller.address,
        to: ctx.vesting.address,
    });
    expect(ctx.vesting.getVestingStatus().releasedTranches).toEqual(0);
    expect(ctx.vesting.getVestingStatus().pendingTranches).toEqual(0);

    val genesis = startVcoinFounderGenesis(ctx);
    expect(genesis).toHaveSuccessfulTx<StartVcoinGenesis>({
        from: ctx.caller.address,
        to: ctx.coordinator.address,
    });
    expect(ctx.minter.getGenesisStatus().genesisIssued).toEqual(
        VCOIN_TOTAL_SUPPLY_BASE_UNITS,
    );
    expect(
        VcoinJettonWallet {
            address: ctx.vesting.getVestingWalletAddress()!,
        }.getWalletData().jettonBalance,
    ).toEqual(VCOIN_FOUNDER_ALLOCATION_BASE_UNITS);

    val beneficiaryWallet = VcoinJettonWallet {
        address: ctx.vesting.getBeneficiaryWalletAddress()!,
    };
    val ownWallet = VcoinJettonWallet {
        address: ctx.vesting.getVestingWalletAddress()!,
    };
    val firstRelease = releaseVcoinFounderVesting(ctx);
    expect(firstRelease).toHaveSuccessfulTx<ReleaseVcoinVesting>({
        from: ctx.caller.address,
        to: ctx.vesting.address,
    });
    expect(firstRelease).toHaveSuccessfulTx<AskToTransfer>({
        from: ctx.vesting.address,
        to: ownWallet.address,
    });
    expect(firstRelease).toHaveSuccessfulTx<InternalTransferStep>({
        from: ownWallet.address,
        to: beneficiaryWallet.address,
    });
    expect(firstRelease).toHaveSuccessfulTx<ReturnExcessesBack>({
        from: beneficiaryWallet.address,
        to: ctx.vesting.address,
    });
    expect(ctx.vesting.getVestingStatus().releasedTranches).toEqual(1);
    expect(ctx.vesting.getVestingStatus().pendingTranches).toEqual(0);
    expect(beneficiaryWallet.getWalletData().jettonBalance).toEqual(
        vcoinFounderTrancheBaseUnits(),
    );

    val finalDue = vcoinMonthlyVestingDueTimestamp(startTimestamp as int, 48);
    testing.setNow(finalDue as uint32);
    val finalRelease = releaseVcoinFounderVesting(ctx);
    expect(finalRelease).toHaveSuccessfulTx<ReleaseVcoinVesting>({
        from: ctx.caller.address,
        to: ctx.vesting.address,
    });
    expect(ctx.vesting.getVestingStatus().releasedTranches).toEqual(48);
    expect(ctx.vesting.getVestingStatus().pendingTranches).toEqual(0);
    expect(beneficiaryWallet.getWalletData().jettonBalance).toEqual(
        VCOIN_FOUNDER_ALLOCATION_BASE_UNITS,
    );
    expect(
        VcoinJettonWallet {
            address: ctx.vesting.getVestingWalletAddress()!,
        }.getWalletData().jettonBalance,
    ).toEqual(0);
}
