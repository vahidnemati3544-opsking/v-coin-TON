import "@acton/emulation/testing"
import "@acton/testing/expect"
import "../contracts/VcoinIssuancePolicy"

fun sampleOwners(): VcoinAllocationOwners {
    val founder = testing.treasury("vcoin-policy-founder");
    val mining = testing.treasury("vcoin-policy-mining");
    val treasury = testing.treasury("vcoin-policy-treasury");
    val liquidity = testing.treasury("vcoin-policy-liquidity");
    val ecosystem = testing.treasury("vcoin-policy-ecosystem");
    return {
        founder: founder.address,
        mining: mining.address,
        treasury: treasury.address,
        liquidity: liquidity.address,
        ecosystem: ecosystem.address,
    };
}

get fun `test VCOIN policy accepts only the five configured allocation owners`() {
    val owners = sampleOwners();
    val state = emptyVcoinIssuanceState();
    val founder = evaluateVcoinMint(state, owners, owners.founder, 1);
    val mining = evaluateVcoinMint(state, owners, owners.mining, 1);
    val treasury = evaluateVcoinMint(state, owners, owners.treasury, 1);
    val liquidity = evaluateVcoinMint(state, owners, owners.liquidity, 1);
    val ecosystem = evaluateVcoinMint(state, owners, owners.ecosystem, 1);
    expect(founder.accepted).toEqual(true);
    expect(founder.allocationId).toEqual(ALLOCATION_FOUNDER);
    expect(mining.accepted).toEqual(true);
    expect(mining.allocationId).toEqual(ALLOCATION_MINING);
    expect(treasury.accepted).toEqual(true);
    expect(treasury.allocationId).toEqual(ALLOCATION_TREASURY);
    expect(liquidity.accepted).toEqual(true);
    expect(liquidity.allocationId).toEqual(ALLOCATION_LIQUIDITY);
    expect(ecosystem.accepted).toEqual(true);
    expect(ecosystem.allocationId).toEqual(ALLOCATION_ECOSYSTEM);
}

get fun `test VCOIN policy rejects an unregistered sixth owner`() {
    val owners = sampleOwners();
    val outsider = testing.treasury("vcoin-policy-outsider");
    val result = evaluateVcoinMint(emptyVcoinIssuanceState(), owners, outsider.address, 1);
    expect(result.accepted).toEqual(false);
    expect(result.nextState.lifetimeIssued).toEqual(0);
}

get fun `test VCOIN policy rejects zero and negative mint amounts`() {
    val owners = sampleOwners();
    val state = emptyVcoinIssuanceState();
    expect(evaluateVcoinMint(state, owners, owners.founder, 0).accepted).toEqual(false);
    expect(evaluateVcoinMint(state, owners, owners.founder, -1).accepted).toEqual(false);
}

get fun `test VCOIN policy enforces each allocation lifetime ceiling`() {
    val owners = sampleOwners();
    var state = emptyVcoinIssuanceState();
    state.founderIssued = VCOIN_FOUNDER_CAP;
    state.lifetimeIssued = VCOIN_FOUNDER_CAP;
    expect(evaluateVcoinMint(state, owners, owners.founder, 1).accepted).toEqual(false);

    state = emptyVcoinIssuanceState();
    state.miningIssued = VCOIN_MINING_CAP;
    state.lifetimeIssued = VCOIN_MINING_CAP;
    expect(evaluateVcoinMint(state, owners, owners.mining, 1).accepted).toEqual(false);

    state = emptyVcoinIssuanceState();
    state.treasuryIssued = VCOIN_TREASURY_CAP;
    state.lifetimeIssued = VCOIN_TREASURY_CAP;
    expect(evaluateVcoinMint(state, owners, owners.treasury, 1).accepted).toEqual(false);

    state = emptyVcoinIssuanceState();
    state.liquidityIssued = VCOIN_LIQUIDITY_CAP;
    state.lifetimeIssued = VCOIN_LIQUIDITY_CAP;
    expect(evaluateVcoinMint(state, owners, owners.liquidity, 1).accepted).toEqual(false);

    state = emptyVcoinIssuanceState();
    state.ecosystemIssued = VCOIN_ECOSYSTEM_CAP;
    state.lifetimeIssued = VCOIN_ECOSYSTEM_CAP;
    expect(evaluateVcoinMint(state, owners, owners.ecosystem, 1).accepted).toEqual(false);
}

get fun `test VCOIN policy enforces the global lifetime issuance ceiling`() {
    val owners = sampleOwners();
    var state = emptyVcoinIssuanceState();
    state.lifetimeIssued = VCOIN_MAX_SUPPLY;
    expect(evaluateVcoinMint(state, owners, owners.founder, 1).accepted).toEqual(false);
}

get fun `test VCOIN burn does not restore lifetime issuance or allocation capacity`() {
    val owners = sampleOwners();
    val minted = evaluateVcoinMint(emptyVcoinIssuanceState(), owners, owners.founder, 100);
    val burned = applyVcoinBurn(minted.nextState, 40);
    expect(burned.totalSupply).toEqual(60);
    expect(burned.lifetimeIssued).toEqual(100);
    expect(burned.founderIssued).toEqual(100);
}

get fun `test VCOIN policy rejects mint after finalization`() {
    val owners = sampleOwners();
    var state = emptyVcoinIssuanceState();
    state.finalized = true;
    val result = evaluateVcoinMint(state, owners, owners.founder, 1);
    expect(result.accepted).toEqual(false);
    expect(result.nextState.finalized).toEqual(true);
}

get fun `test VCOIN issuance finalization requires every exact allocation`() {
    var state = emptyVcoinIssuanceState();
    expect(finalizeVcoinIssuance(state).finalized).toEqual(false);

    state.founderIssued = VCOIN_FOUNDER_CAP;
    state.miningIssued = VCOIN_MINING_CAP;
    state.treasuryIssued = VCOIN_TREASURY_CAP;
    state.liquidityIssued = VCOIN_LIQUIDITY_CAP;
    state.ecosystemIssued = VCOIN_ECOSYSTEM_CAP;
    state.lifetimeIssued = VCOIN_MAX_SUPPLY;
    expect(finalizeVcoinIssuance(state).finalized).toEqual(true);
}
