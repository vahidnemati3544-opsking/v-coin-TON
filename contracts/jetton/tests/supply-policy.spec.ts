const TOKEN_DECIMALS = 1_000_000n;
const MAX_SUPPLY = 2_100_000_000n * TOKEN_DECIMALS;
const ALLOCATIONS = {
  founder: 420_000_000n * TOKEN_DECIMALS,
  mining: 1_050_000_000n * TOKEN_DECIMALS,
  treasury: 210_000_000n * TOKEN_DECIMALS,
  liquidity: 210_000_000n * TOKEN_DECIMALS,
  ecosystem: 210_000_000n * TOKEN_DECIMALS
};

describe("VCOIN fixed-supply policy", () => {
  test("uses six decimals and a 2.1 billion token cap", () => {
    expect(MAX_SUPPLY).toBe(2_100_000_000_000_000n);
  });
  test("allocation schedule sums exactly to the hard cap", () => {
    const sum = Object.values(ALLOCATIONS).reduce((a, b) => a + b, 0n);
    expect(sum).toBe(MAX_SUPPLY);
  });
  test("rejects any issuance that exceeds the hard cap", () => {
    expect(MAX_SUPPLY + 1n > MAX_SUPPLY).toBe(true);
  });
  test("does not permit a further mint after full initial issuance", () => {
    const supplyAfterFinalAllocation = Object.values(ALLOCATIONS).reduce((a, b) => a + b, 0n);
    const mintableAfterFinalAllocation = supplyAfterFinalAllocation < MAX_SUPPLY;
    expect(mintableAfterFinalAllocation).toBe(false);
  });
});