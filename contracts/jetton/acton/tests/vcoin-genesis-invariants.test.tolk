import "@acton/testing/expect"
import "@contracts/vcoin-genesis-config"
import "@contracts/vcoin-vesting-calendar"

get fun `test VCOIN genesis allocations sum to exact fixed supply`() {
    expect(vcoinGenesisAllocationTotal()).toEqual(VCOIN_TOTAL_SUPPLY_BASE_UNITS);
}

get fun `test VCOIN genesis allocation buckets match approved base units`() {
    expect(VCOIN_FOUNDER_ALLOCATION_BASE_UNITS).toEqual(2000000000000000);
    expect(VCOIN_MINING_RESERVE_BASE_UNITS).toEqual(5000000000000000);
    expect(VCOIN_TREASURY_ALLOCATION_BASE_UNITS).toEqual(1000000000000000);
    expect(VCOIN_LIQUIDITY_ALLOCATION_BASE_UNITS).toEqual(1000000000000000);
    expect(VCOIN_ECOSYSTEM_ALLOCATION_BASE_UNITS).toEqual(1000000000000000);
}

get fun `test VCOIN decimals and supply cap remain fixed`() {
    expect(VCOIN_DECIMALS).toEqual(6);
    expect(VCOIN_TOTAL_SUPPLY_BASE_UNITS).toEqual(10000000000000000);
}

get fun `test founder vesting integer tranches total exactly 48 months`() {
    expect(
        vcoinFounderTrancheBaseUnits() * 47 + vcoinFounderFinalTrancheBaseUnits(),
    ).toEqual(VCOIN_FOUNDER_ALLOCATION_BASE_UNITS);
    expect(vcoinFounderFinalTrancheBaseUnits()).toEqual(
        vcoinFounderTrancheBaseUnits() + VCOIN_FOUNDER_ALLOCATION_BASE_UNITS % 48,
    );
}

get fun `test monthly vesting clamps January 31 to leap-day February`() {
    expect(vcoinMonthlyVestingDueTimestamp(1706704496, 1)).toEqual(1709210096);
}

get fun `test monthly vesting restores January 31 after February clamp`() {
    expect(vcoinMonthlyVestingDueTimestamp(1706704496, 2)).toEqual(1711888496);
}

get fun `test monthly vesting clamps January 31 to non-leap February`() {
    expect(vcoinMonthlyVestingDueTimestamp(1675168496, 1)).toEqual(1677587696);
}

get fun `test monthly vesting clamps March 31 to April 30`() {
    expect(vcoinMonthlyVestingDueTimestamp(1711843200, 1)).toEqual(1714435200);
}

get fun `test monthly vesting preserves UTC time of day`() {
    expect(vcoinMonthlyVestingDueTimestamp(1706704496, 1) % 86400).toEqual(45296);
}
