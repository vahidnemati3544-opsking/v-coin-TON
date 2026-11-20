// VCOIN issuance policy kernel. This module is deliberately pure and is not yet
// wired into JettonMinter; see docs/VCOIN_ONCHAIN_POLICY_SPEC.md.
const VCOIN_MAX_SUPPLY = 10000000000000000
const VCOIN_FOUNDER_CAP = 2000000000000000
const VCOIN_MINING_CAP = 5000000000000000
const VCOIN_TREASURY_CAP = 1000000000000000
const VCOIN_LIQUIDITY_CAP = 1000000000000000
const VCOIN_ECOSYSTEM_CAP = 1000000000000000

const ALLOCATION_NONE = 0
const ALLOCATION_FOUNDER = 1
const ALLOCATION_MINING = 2
const ALLOCATION_TREASURY = 3
const ALLOCATION_LIQUIDITY = 4
const ALLOCATION_ECOSYSTEM = 5

struct VcoinAllocationOwners {
    founder: address
    mining: address
    treasury: address
    liquidity: address
    ecosystem: address
}

struct VcoinIssuanceState {
    totalSupply: int
    lifetimeIssued: int
    founderIssued: int
    miningIssued: int
    treasuryIssued: int
    liquidityIssued: int
    ecosystemIssued: int
    finalized: bool
}

struct VcoinMintDecision {
    accepted: bool
    allocationId: int
    nextState: VcoinIssuanceState
}

fun emptyVcoinIssuanceState(): VcoinIssuanceState {
    return {
        totalSupply: 0,
        lifetimeIssued: 0,
        founderIssued: 0,
        miningIssued: 0,
        treasuryIssued: 0,
        liquidityIssued: 0,
        ecosystemIssued: 0,
        finalized: false,
    };
}

fun rejectVcoinMint(state: VcoinIssuanceState): VcoinMintDecision {
    return {
        accepted: false,
        allocationId: ALLOCATION_NONE,
        nextState: state,
    };
}

// Returns a candidate state only. The Jetton master must persist this state
// atomically with the corresponding wallet transfer and bounce/replay controls.
fun evaluateVcoinMint(
    state: VcoinIssuanceState,
    owners: VcoinAllocationOwners,
    recipient: address,
    amount: int,
): VcoinMintDecision {
    if (state.finalized || amount <= 0 || state.lifetimeIssued + amount > VCOIN_MAX_SUPPLY) {
        return rejectVcoinMint(state);
    }

    var next = state;
    var allocationId = ALLOCATION_NONE;

    if (recipient == owners.founder) {
        if (state.founderIssued + amount > VCOIN_FOUNDER_CAP) {
            return rejectVcoinMint(state);
        }
        next.founderIssued += amount;
        allocationId = ALLOCATION_FOUNDER;
    } else if (recipient == owners.mining) {
        if (state.miningIssued + amount > VCOIN_MINING_CAP) {
            return rejectVcoinMint(state);
        }
        next.miningIssued += amount;
        allocationId = ALLOCATION_MINING;
    } else if (recipient == owners.treasury) {
        if (state.treasuryIssued + amount > VCOIN_TREASURY_CAP) {
            return rejectVcoinMint(state);
        }
        next.treasuryIssued += amount;
        allocationId = ALLOCATION_TREASURY;
    } else if (recipient == owners.liquidity) {
        if (state.liquidityIssued + amount > VCOIN_LIQUIDITY_CAP) {
            return rejectVcoinMint(state);
        }
        next.liquidityIssued += amount;
        allocationId = ALLOCATION_LIQUIDITY;
    } else if (recipient == owners.ecosystem) {
        if (state.ecosystemIssued + amount > VCOIN_ECOSYSTEM_CAP) {
            return rejectVcoinMint(state);
        }
        next.ecosystemIssued += amount;
        allocationId = ALLOCATION_ECOSYSTEM;
    } else {
        return rejectVcoinMint(state);
    }

    next.totalSupply += amount;
    next.lifetimeIssued += amount;
    return {
        accepted: true,
        allocationId,
        nextState: next,
    };
}

// A burn decreases outstanding supply only. Lifetime and allocation counters
// deliberately remain unchanged so burned tokens cannot reopen mint capacity.
fun applyVcoinBurn(state: VcoinIssuanceState, amount: int): VcoinIssuanceState {
    if (amount <= 0 || amount > state.totalSupply) {
        return state;
    }
    var next = state;
    next.totalSupply -= amount;
    return next;
}

// One-way finalization is allowed only after every allocation is fully issued.
// The production minter must make this transition irreversible on-chain.
fun finalizeVcoinIssuance(state: VcoinIssuanceState): VcoinIssuanceState {
    if (
        state.finalized || state.founderIssued != VCOIN_FOUNDER_CAP ||
        state.miningIssued != VCOIN_MINING_CAP ||
        state.treasuryIssued != VCOIN_TREASURY_CAP ||
        state.liquidityIssued != VCOIN_LIQUIDITY_CAP ||
        state.ecosystemIssued != VCOIN_ECOSYSTEM_CAP ||
        state.lifetimeIssued != VCOIN_MAX_SUPPLY
    ) {
        return state;
    }
    var next = state;
    next.finalized = true;
    return next;
}
