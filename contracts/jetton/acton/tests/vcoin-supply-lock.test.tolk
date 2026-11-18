import "@acton/testing/expect"
import "test-utils"
import "../contracts/errors"
import "../contracts/messages"

const VCOIN_INITIAL_SUPPLY_BASE_UNITS = 10000000000000000

get fun `test VCOIN can issue exactly ten billion tokens and reject supply above cap`() {
    val (minter, deployer, notDeployer) = setupTest();
    val wallet = mintTo(minter, deployer, deployer.address, VCOIN_INITIAL_SUPPLY_BASE_UNITS);
    expect(wallet.getJettonBalance()).toEqual(VCOIN_INITIAL_SUPPLY_BASE_UNITS);
    expect(minter.getTotalSupply()).toEqual(VCOIN_INITIAL_SUPPLY_BASE_UNITS);

    val overCap = minter.sendMint(deployer.address, notDeployer.address, 1, grams("0.05"), grams("0.3"));
    expect(overCap).toHaveFailedTx<MintNewJettons>({
        from: deployer.address,
        to: minter.address,
        exitCode: ERROR_SUPPLY_CAP,
    });
    expect(minter.getTotalSupply()).toEqual(VCOIN_INITIAL_SUPPLY_BASE_UNITS);
}

get fun `test VCOIN admin lock permanently disables minting but leaves transfers enabled`() {
    val (minter, deployer, notDeployer) = setupTest();
    val amount = 1000000;
    val senderWallet = mintTo(minter, deployer, deployer.address, amount);

    val lockResult = minter.sendDropAdmin(deployer.address);
    expect(lockResult).toHaveSuccessfulTx<DropMinterAdmin>({
        from: deployer.address,
        to: minter.address,
    });

    val minterData = minter.getJettonData();
    expect(minterData.mintable).toEqual(false);
    expect(minterData.adminAddress).toEqual(null);

    val forbiddenMint = minter.sendMint(deployer.address, deployer.address, 1, grams("0.05"), grams("0.3"));
    expect(forbiddenMint).toHaveFailedTx<MintNewJettons>({
        from: deployer.address,
        to: minter.address,
        exitCode: ERROR_NOT_OWNER,
    });

    val transfer = senderWallet.sendTransferPayloadAuto(
        deployer.address,
        DEFAULT_TRANSFER_MSG_VALUE,
        500000,
        notDeployer.address,
        deployer.address,
        null,
        0,
        makeTinyForwardPayload(),
    );
    expect(transfer).toHaveSuccessfulTx<AskToTransfer>({
        from: deployer.address,
        to: senderWallet.address,
    });
    expect(transfer).toHaveSuccessfulTx<InternalTransferStep>({
        from: senderWallet.address,
        to: userWallet(minter, notDeployer.address).address,
    });
    expect(senderWallet.getJettonBalance()).toEqual(500000);
    expect(userWallet(minter, notDeployer.address).getJettonBalance()).toEqual(500000);
    expect(minter.getTotalSupply()).toEqual(amount);
}
