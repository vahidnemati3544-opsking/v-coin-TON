import {
  APPROVED_ALLOCATIONS,
  buildFounderAllocationPlan,
  TOTAL_SUPPLY_BASE_UNITS,
} from "../scripts/allocation-transfer-plan";

const validRequests = APPROVED_ALLOCATIONS.map((item) => ({ ...item }));
const FULL_SUPPLY = TOTAL_SUPPLY_BASE_UNITS;

describe("Founder allocation transfer planner", () => {
  test("creates a review-only plan for exactly four approved distributions", () => {
    const plan = buildFounderAllocationPlan(validRequests, FULL_SUPPLY);
    expect(plan.status).toBe("UNSIGNED_REVIEW_ONLY");
    expect(plan.transfers).toHaveLength(4);
    expect(plan.transferTotalBaseUnits).toBe("1680000000000000");
    expect(plan.createsTonPayload).toBe(false);
    expect(plan.signs).toBe(false);
    expect(plan.broadcasts).toBe(false);
    expect(plan.requiresFounderReviewAndSignature).toBe(true);
  });

  test("rejects an unknown destination", () => {
    const requests = validRequests.map((item, i) =>
      i === 0 ? { ...item, destination: "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ" } : item
    );
    expect(() => buildFounderAllocationPlan(requests, FULL_SUPPLY)).toThrow("Destination does not match");
  });

  test("rejects an altered allocation amount", () => {
    const requests = validRequests.map((item, i) =>
      i === 1 ? { ...item, amountBaseUnits: "1" } : item
    );
    expect(() => buildFounderAllocationPlan(requests, FULL_SUPPLY)).toThrow("Amount does not match");
  });

  test("rejects duplicate role and duplicate destination", () => {
    const duplicateRole = [...validRequests, validRequests[0]];
    expect(() => buildFounderAllocationPlan(duplicateRole, FULL_SUPPLY)).toThrow("Exactly four");
    const duplicateDestination = validRequests.map((item, i) =>
      i === 1 ? { ...item, destination: validRequests[0].destination } : item
    );
    expect(() => buildFounderAllocationPlan(duplicateDestination, FULL_SUPPLY)).toThrow("Duplicate allocation destination");
  });

  test("rejects missing transfer", () => {
    expect(() => buildFounderAllocationPlan(validRequests.slice(0, 3), FULL_SUPPLY)).toThrow("Exactly four");
  });

  test("rejects insufficient Founder balance", () => {
    expect(() => buildFounderAllocationPlan(validRequests, "1679999999999999")).toThrow("Founder balance is insufficient");
  });

  test("rejects malformed balance input", () => {
    expect(() => buildFounderAllocationPlan(validRequests, "1.5")).toThrow("non-negative integer");
  });
});
