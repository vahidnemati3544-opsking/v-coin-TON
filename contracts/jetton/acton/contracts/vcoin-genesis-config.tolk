// V COIN - TON fixed genesis economics.
// This module is a compile-time specification/test input only.
// It does not issue Jettons and must not be treated as a deployed contract.

const VCOIN_DECIMALS = 6
const VCOIN_TOTAL_SUPPLY_BASE_UNITS = 10000000000000000

const VCOIN_FOUNDER_ALLOCATION_BASE_UNITS = 2000000000000000
const VCOIN_MINING_RESERVE_BASE_UNITS = 5000000000000000
const VCOIN_TREASURY_ALLOCATION_BASE_UNITS = 1000000000000000
const VCOIN_LIQUIDITY_ALLOCATION_BASE_UNITS = 1000000000000000
const VCOIN_ECOSYSTEM_ALLOCATION_BASE_UNITS = 1000000000000000

fun vcoinGenesisAllocationTotal(): int {
    return VCOIN_FOUNDER_ALLOCATION_BASE_UNITS +
        VCOIN_MINING_RESERVE_BASE_UNITS +
        VCOIN_TREASURY_ALLOCATION_BASE_UNITS +
        VCOIN_LIQUIDITY_ALLOCATION_BASE_UNITS +
        VCOIN_ECOSYSTEM_ALLOCATION_BASE_UNITS;
}

fun vcoinFounderTrancheBaseUnits(): int {
    return VCOIN_FOUNDER_ALLOCATION_BASE_UNITS / 48;
}

fun vcoinFounderFinalTrancheBaseUnits(): int {
    return vcoinFounderTrancheBaseUnits() +
        VCOIN_FOUNDER_ALLOCATION_BASE_UNITS % 48;
}
