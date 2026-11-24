/**
 * Founder-controlled VCOIN allocation planner.
 *
 * Produces a review-only plan. It does not build TON messages, sign, submit,
 * or broadcast transactions. Destination/amount restrictions here are
 * planner-side checks; the generic TEP-74 wallet does not enforce them on-chain.
 */
export const APPROVED_ALLOCATIONS = [
  {
    role: "mining_reserve",
    destination: "UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0",
    amountBaseUnits: "1050000000000000",
  },
  {
    role: "treasury",
    destination: "UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ",
    amountBaseUnits: "210000000000000",
  },
  {
    role: "liquidity_market",
    destination: "UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn",
    amountBaseUnits: "210000000000000",
  },
  {
    role: "ecosystem_marketing",
    destination: "UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE",
    amountBaseUnits: "210000000000000",
  },
] as const;

export const FOUNDER_RETAINED_BASE_UNITS = "420000000000000";
export const TOTAL_SUPPLY_BASE_UNITS = "2100000000000000";

export type RequestedAllocation = {
  role: string;
  destination: string;
  amountBaseUnits: string;
};

export function buildFounderAllocationPlan(
  requests: RequestedAllocation[],
  founderJettonBalanceBaseUnits: string,
) {
  if (!/^\d+$/.test(founderJettonBalanceBaseUnits)) {
    throw new Error("Founder Jetton balance must be a non-negative integer string");
  }
  if (requests.length !== APPROVED_ALLOCATIONS.length) {
    throw new Error("Exactly four approved allocation transfers are required");
  }
  const seenRoles = new Set<string>();
  const seenDestinations = new Set<string>();
  let total = 0n;

  const transfers = requests.map((request) => {
    if (seenRoles.has(request.role)) throw new Error("Duplicate allocation role");
    if (seenDestinations.has(request.destination)) throw new Error("Duplicate allocation destination");
    seenRoles.add(request.role);
    seenDestinations.add(request.destination);

    const approved = APPROVED_ALLOCATIONS.find((item) => item.role === request.role);
    if (!approved) throw new Error("Unapproved allocation role");
    if (request.destination !== approved.destination) throw new Error("Destination does not match approved wallet");
    if (request.amountBaseUnits !== approved.amountBaseUnits) throw new Error("Amount does not match approved allocation");
    total += BigInt(request.amountBaseUnits);

    return {
      role: approved.role,
      destination: approved.destination,
      amountBaseUnits: approved.amountBaseUnits,
    };
  });

  for (const approved of APPROVED_ALLOCATIONS) {
    if (!seenRoles.has(approved.role)) throw new Error("Missing approved allocation role");
  }
  if (total !== 1_680_000_000_000_000n) {
    throw new Error("Distribution total must equal 1,680,000,000 VCOIN");
  }
  const balance = BigInt(founderJettonBalanceBaseUnits);
  if (balance < total + BigInt(FOUNDER_RETAINED_BASE_UNITS)) {
    throw new Error("Founder balance is insufficient to distribute allocations and retain Founder share");
  }

  return {
    status: "UNSIGNED_REVIEW_ONLY" as const,
    network: "TON_MAINNET" as const,
    token: "VCOIN",
    decimals: 6,
    founderRetainedBaseUnits: FOUNDER_RETAINED_BASE_UNITS,
    founderBalanceBaseUnits: founderJettonBalanceBaseUnits,
    transferTotalBaseUnits: total.toString(),
    transfers,
    requiresFounderReviewAndSignature: true,
    createsTonPayload: false,
    signs: false,
    broadcasts: false,
    enforcement: "planner-side only; not an on-chain recipient restriction",
  };
}
