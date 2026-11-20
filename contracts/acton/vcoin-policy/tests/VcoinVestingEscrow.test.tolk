import "@acton/emulation/testing"
import "@acton/testing/expect"
import "../../jetton-v2.1/contracts/VcoinVestingEscrow"

const FOUNDER_BENEFICIARY = address("UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy")
const MINING_BENEFICIARY = address("UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0")
const FOUNDER_CONTROLLER = address("UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy")
const TEST_START = 1700000000

fun founderVestingConfig(): VcoinVestingEscrowStorage {
    val minter = testing.treasury("vcoin-founder-vesting-minter");
    return {
        vestingKind: VCOIN_VESTING_FOUNDER,
        minterAddress: minter.address,
        beneficiaryAddress: FOUNDER_BENEFICIARY,
        controllerAddress: FOUNDER_CONTROLLER,
        allocationAmount: VCOIN_FOUNDER_AMOUNT,
        startTime: TEST_START,
        duration: VCOIN_FOUNDER_DURATION,
        configQueryId: 1,
        deposited: false,
        releasedAmount: 0,
        pendingReleaseAmount: 0,
        pendingReleaseQueryId: 0,
    };
}

fun miningVestingConfig(): VcoinVestingEscrowStorage {
    val minter = testing.treasury("vcoin-mining-vesting-minter");
    return {
        vestingKind: VCOIN_VESTING_MINING,
        minterAddress: minter.address,
        beneficiaryAddress: MINING_BENEFICIARY,
        controllerAddress: FOUNDER_CONTROLLER,
        allocationAmount: VCOIN_MINING_AMOUNT,
        startTime: TEST_START,
        duration: VCOIN_MINING_DURATION,
        configQueryId: 2,
        deposited: false,
        releasedAmount: 0,
    };
}

get fun `test founder vesting has no release before its start time`() {
    val storage = founderVestingConfig();
    expect(vcoinVestedAmount(storage, TEST_START - 1)).toEqual(0);
    expect(vcoinVestedAmount(storage, TEST_START)).toEqual(0);
}

get fun `test founder vesting accrues linearly and fully vests at four years`() {
    val storage = founderVestingConfig();
    expect(vcoinVestedAmount(storage, TEST_START + VCOIN_FOUNDER_DURATION / 2))
        .toEqual(VCOIN_FOUNDER_AMOUNT / 2);
    expect(vcoinVestedAmount(storage, TEST_START + VCOIN_FOUNDER_DURATION))
        .toEqual(VCOIN_FOUNDER_AMOUNT);
    expect(vcoinVestedAmount(storage, TEST_START + VCOIN_FOUNDER_DURATION + 1))
        .toEqual(VCOIN_FOUNDER_AMOUNT);
}

get fun `test mining reserve vests linearly over twenty four months`() {
    val storage = miningVestingConfig();
    expect(vcoinVestedAmount(storage, TEST_START + VCOIN_MINING_DURATION / 2))
        .toEqual(VCOIN_MINING_AMOUNT / 2);
    expect(vcoinVestedAmount(storage, TEST_START + VCOIN_MINING_DURATION))
        .toEqual(VCOIN_MINING_AMOUNT);
}

