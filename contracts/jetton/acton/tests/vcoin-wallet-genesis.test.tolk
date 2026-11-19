import "@acton/emulation/network"
import "@acton/emulation/testing"
import "@acton/testing/expect"
import "@contracts/messages"
import "@contracts/vcoin-messages"
import "@contracts/vcoin-storage"
import "@wrappers/VcoinJettonWallet.gen"
import "test-utils"

const VCOIN_WALLET_TEST_QUERY_ID = 777
const VCOIN_WALLET_TEST_AMOUNT = 123456789

struct VcoinWalletTestContext {
    wallet: VcoinJettonWallet
    minter: Treasury
    owner: Treasury
}

fun setupVcoinWalletTest(): VcoinWalletTestContext {
    val minter = testing.treasury("vcoin-genesis-minter");
    val owner = testing.treasury("vcoin-genesis-owner");
    val wallet = VcoinJettonWallet.fromStorage(VcoinWalletStorage {
        jettonBalance: 0,
        ownerAddress: owner.address,
        minterAddress: minter.address,
        genesisCredited: false,
        genesisQueryId: 0,
        genesisAmount: 0,
    });
    val deploy = wallet.sendDeploy(minter.address, { value: grams("10") });
    expect(deploy).toHaveSuccessfulDeploy({ to: wallet.address });
    return { wallet, minter, owner };
}

fun sendVcoinGenesisCredit(ctx: VcoinWalletTestContext): SendResultList {
    return net.send(
        ctx.minter.address,
        createMessage({
            bounce: true,
            value: grams("1"),
            dest: ctx.wallet.address,
            body: InternalTransferStep {
                queryId: VCOIN_WALLET_TEST_QUERY_ID,
                jettonAmount: VCOIN_WALLET_TEST_AMOUNT,
                transferInitiator: null,
                sendExcessesTo: null,
                forwardTonAmount: 0,
                forwardPayload: makeTinyForwardPayload(),
            },
        }),
    );
}

get fun `test VCOIN wallet credits first genesis message once and acknowledges it`() {
    val ctx = setupVcoinWalletTest();
    val result = sendVcoinGenesisCredit(ctx);
    expect(result).toHaveSuccessfulTx<InternalTransferStep>({
        from: ctx.minter.address,
        to: ctx.wallet.address,
    });
    expect(ctx.wallet.getWalletData().jettonBalance).toEqual(VCOIN_WALLET_TEST_AMOUNT);
    expect(ctx.wallet.getWalletData().genesisCredited).toEqual(true);
    expect(ctx.wallet.getWalletData().genesisQueryId).toEqual(VCOIN_WALLET_TEST_QUERY_ID);
    expect(ctx.wallet.getWalletData().genesisAmount).toEqual(VCOIN_WALLET_TEST_AMOUNT);
    expect(
        result.findTransaction<VcoinGenesisCreditAck>({
            from: ctx.wallet.address,
            to: ctx.minter.address,
        }),
    ).toBeNotNull();
}

get fun `test VCOIN wallet replay resends acknowledgement without double credit`() {
    val ctx = setupVcoinWalletTest();
    val first = sendVcoinGenesisCredit(ctx);
    expect(first).toHaveSuccessfulTx<InternalTransferStep>({
        from: ctx.minter.address,
        to: ctx.wallet.address,
    });

    val replay = sendVcoinGenesisCredit(ctx);
    expect(replay).toHaveSuccessfulTx<InternalTransferStep>({
        from: ctx.minter.address,
        to: ctx.wallet.address,
    });
    expect(ctx.wallet.getWalletData().jettonBalance).toEqual(VCOIN_WALLET_TEST_AMOUNT);
    expect(
        replay.findTransaction<VcoinGenesisCreditAck>({
            from: ctx.wallet.address,
            to: ctx.minter.address,
        }),
    ).toBeNotNull();
}
