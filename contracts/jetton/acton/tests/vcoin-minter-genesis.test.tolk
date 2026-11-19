import "@acton/build"
import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"
import "@contracts/messages"
import "@contracts/vcoin-genesis-config"
import "@contracts/vcoin-messages"
import "@contracts/vcoin-minter-storage"
import "@contracts/vcoin-minter-utils"
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
    coordinator: Treasury
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
    val coordinator = testing.treasury("vcoin-genesis-coordinator");
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
        recipients,
    };
}

fun requestVcoinGenesisSlot(
    ctx: VcoinMinterTestContext,
    slotId: uint8,
): SendResultList {
    return net.send(
        ctx.coordinator.address,
        createMessage({
            bounce: true,
            value: grams("1"),
            dest: ctx.minter.address,
            body: VcoinGenesisSlotRequest { slotId },
        }),
    );
}

get fun `test VCOIN Master completes all five fixed genesis allocations exactly once`() {
    val ctx = setupVcoinMinterTest();

    val slot1 = requestVcoinGenesisSlot(ctx, 1);
    expect(slot1).toHaveSuccessfulTx<VcoinGenesisSlotRequest>({
        from: ctx.coordinator.address,
        to: ctx.minter.address,
    });
    expect(ctx.minter.getJettonData().totalSupply).toEqual(VCOIN_FOUNDER_ALLOCATION_BASE_UNITS);
    expect(ctx.minter.getGenesisStatus().completedSlots).toEqual(1);

    val founderWallet = VcoinJettonWallet {
        address: ctx.minter.getWalletAddress(ctx.recipients.founder.address),
    };
    expect(founderWallet.getWalletData().jettonBalance).toEqual(
        VCOIN_FOUNDER_ALLOCATION_BASE_UNITS,
    );

    val duplicateSlot1 = requestVcoinGenesisSlot(ctx, 1);
    expect(duplicateSlot1).toHaveSuccessfulTx<VcoinGenesisSlotRequest>({
        from: ctx.coordinator.address,
        to: ctx.minter.address,
    });
    expect(ctx.minter.getJettonData().totalSupply).toEqual(VCOIN_FOUNDER_ALLOCATION_BASE_UNITS);
    expect(founderWallet.getWalletData().jettonBalance).toEqual(
        VCOIN_FOUNDER_ALLOCATION_BASE_UNITS,
    );

    requestVcoinGenesisSlot(ctx, 2);
    requestVcoinGenesisSlot(ctx, 3);
    requestVcoinGenesisSlot(ctx, 4);
    requestVcoinGenesisSlot(ctx, 5);

    val finalData = ctx.minter.getJettonData();
    val finalStatus = ctx.minter.getGenesisStatus();
    expect(finalData.totalSupply).toEqual(VCOIN_TOTAL_SUPPLY_BASE_UNITS);
    expect(finalData.mintable).toEqual(false);
    expect(finalStatus.genesisIssued).toEqual(VCOIN_TOTAL_SUPPLY_BASE_UNITS);
    expect(finalStatus.completedSlots).toEqual(5);
    expect(finalStatus.genesisComplete).toEqual(true);
}

get fun `test VCOIN burn reduces circulating supply without replenishing genesis issuance`() {
    val ctx = setupVcoinMinterTest();
    requestVcoinGenesisSlot(ctx, 1);
    requestVcoinGenesisSlot(ctx, 2);
    requestVcoinGenesisSlot(ctx, 3);
    requestVcoinGenesisSlot(ctx, 4);
    requestVcoinGenesisSlot(ctx, 5);

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
