import "@acton/build"
import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"
import "@contracts/messages"
import "@contracts/vcoin-genesis-config"
import "@contracts/vcoin-messages"
import "@contracts/vcoin-minter-storage"
import "@contracts/vcoin-minter-utils"
import "@wrappers/VcoinGenesisCoordinator.gen"
import "@wrappers/VcoinJettonMinter.gen"
import "@wrappers/VcoinJettonWallet.gen"
import "test-utils"

struct VcoinMinterTestRecipients {
    founder: Treasury
    mining: Treasury
    treasury: Treasury
    liquidity: Treasury
    ecosystem: Treasury
}

struct VcoinMinterTestContext {
    minter: VcoinJettonMinter
    coordinator: VcoinGenesisCoordinator
    caller: Treasury
    recipients: VcoinMinterTestRecipients
}

fun makeVcoinGenesisSlot(recipient: address, amount: coins): Cell<VcoinGenesisSlot> {
    return VcoinGenesisSlot {
        recipient,
        amount,
        status: 0,
        queryId: 0,
    }.toCell();
}

fun setupVcoinMinterTest(): VcoinMinterTestContext {
    val deployer = testing.treasury("vcoin-master-deployer");
    val caller = testing.treasury("vcoin-genesis-caller");
    val coordinatorInit = calcDeployedVcoinGenesisCoordinator(
        build("VcoinGenesisCoordinator"),
        deployer.address,
    );
    val coordinator = VcoinGenesisCoordinator { address: coordinatorInit.calculateAddress() };
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

    val recipients = VcoinMinterTestRecipients {
        founder: testing.treasury("vcoin-founder-vesting"),
        mining: testing.treasury("vcoin-mining-reserve"),
        treasury: testing.treasury("vcoin-treasury"),
        liquidity: testing.treasury("vcoin-liquidity"),
        ecosystem: testing.treasury("vcoin-ecosystem"),
    };

    val coreSlots = VcoinGenesisCoreSlots {
        founderSlot: makeVcoinGenesisSlot(
            recipients.founder.address,
            VCOIN_FOUNDER_ALLOCATION_BASE_UNITS,
        ),
        miningSlot: makeVcoinGenesisSlot(
            recipients.mining.address,
            VCOIN_MINING_RESERVE_BASE_UNITS,
        ),
        treasurySlot: makeVcoinGenesisSlot(
            recipients.treasury.address,
            VCOIN_TREASURY_ALLOCATION_BASE_UNITS,
        ),
    }.toCell();
    val extraSlots = VcoinGenesisExtraSlots {
        liquiditySlot: makeVcoinGenesisSlot(
            recipients.liquidity.address,
            VCOIN_LIQUIDITY_ALLOCATION_BASE_UNITS,
        ),
        ecosystemSlot: makeVcoinGenesisSlot(
            recipients.ecosystem.address,
            VCOIN_ECOSYSTEM_ALLOCATION_BASE_UNITS,
        ),
    }.toCell();

    val minterStorage = VcoinMinterStorage {
        totalSupply: 0,
        genesisIssued: 0,
        metadata: buildTestMetadata("vcoin-ton-test"),
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
    val deploy = net.send(
        deployer.address,
        createMessage({
            bounce: false,
            value: grams("10"),
            dest: minterInit,
            body: TopUpTons {},
        }),
    );
    expect(deploy).toHaveSuccessfulDeploy({ to: minter.address });

    return {
        minter,
        coordinator,
        caller,
        recipients,
    };
}

fun startVcoinGenesis(ctx: VcoinMinterTestContext): SendResultList {
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

get fun `test VCOIN coordinator completes all five fixed genesis allocations exactly once`() {
    val ctx = setupVcoinMinterTest();

    expect(ctx.minter.getContractBalance() > grams("5")).toEqual(true);
    val genesis = startVcoinGenesis(ctx);
    expect(genesis).toHaveSuccessfulTx<StartVcoinGenesis>({
        from: ctx.caller.address,
        to: ctx.coordinator.address,
    });
    expect(genesis).toHaveSuccessfulTx<VcoinGenesisSlotRequest>({
        from: ctx.coordinator.address,
        to: ctx.minter.address,
    });

    val founderWallet = VcoinJettonWallet {
        address: ctx.minter.getWalletAddress(ctx.recipients.founder.address),
    };
    expect(genesis).toHaveSuccessfulTx<InternalTransferStep>({
        from: ctx.minter.address,
        to: founderWallet.address,
    });
    expect(genesis).toHaveSuccessfulTx<VcoinGenesisCreditAck>({
        from: founderWallet.address,
        to: ctx.minter.address,
    });

    val finalData = ctx.minter.getJettonData();
    val finalStatus = ctx.minter.getGenesisStatus();
    expect(finalData.totalSupply).toEqual(VCOIN_TOTAL_SUPPLY_BASE_UNITS);
    expect(finalData.mintable).toEqual(false);
    expect(finalStatus.genesisIssued).toEqual(VCOIN_TOTAL_SUPPLY_BASE_UNITS);
    expect(finalStatus.completedSlots).toEqual(5);
    expect(finalStatus.genesisComplete).toEqual(true);
    expect(founderWallet.getWalletData().jettonBalance).toEqual(
        VCOIN_FOUNDER_ALLOCATION_BASE_UNITS,
    );

    val duplicateGenesis = startVcoinGenesis(ctx);
    expect(duplicateGenesis).toHaveSuccessfulTx<StartVcoinGenesis>({
        from: ctx.caller.address,
        to: ctx.coordinator.address,
    });
    expect(ctx.minter.getJettonData().totalSupply).toEqual(VCOIN_TOTAL_SUPPLY_BASE_UNITS);
    expect(founderWallet.getWalletData().jettonBalance).toEqual(
        VCOIN_FOUNDER_ALLOCATION_BASE_UNITS,
    );
}

get fun `test VCOIN burn reduces circulating supply without replenishing genesis issuance`() {
    val ctx = setupVcoinMinterTest();
    startVcoinGenesis(ctx);

    val founderWallet = VcoinJettonWallet {
        address: ctx.minter.getWalletAddress(ctx.recipients.founder.address),
    };
    val burn = net.send(
        ctx.recipients.founder.address,
        createMessage({
            bounce: true,
            value: grams("0.3"),
            dest: founderWallet.address,
            body: AskToBurn {
                queryId: 9001,
                jettonAmount: 1000000,
                customPayload: null,
                sendExcessesTo: null,
            },
        }),
    );
    expect(burn).toHaveSuccessfulTx<AskToBurn>({
        from: ctx.recipients.founder.address,
        to: founderWallet.address,
    });
    expect(ctx.minter.getJettonData().totalSupply).toEqual(
        VCOIN_TOTAL_SUPPLY_BASE_UNITS - 1000000,
    );
    expect(ctx.minter.getGenesisStatus().genesisIssued).toEqual(
        VCOIN_TOTAL_SUPPLY_BASE_UNITS,
    );
    expect(founderWallet.getWalletData().jettonBalance).toEqual(
        VCOIN_FOUNDER_ALLOCATION_BASE_UNITS - 1000000,
    );
}
