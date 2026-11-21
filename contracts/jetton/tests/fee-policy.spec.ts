import { enforceTonFeeCap, parseTonLimitToNano, TonCenterFeeEstimate } from "../deploy/fee-policy";

const breakdown = (n: string) => ({
  in_fwd_fee: n,
  storage_fee: "0",
  gas_fee: "0",
  fwd_fee: "0"
});

const estimate = (source: string, destination: string): TonCenterFeeEstimate => ({
  ok: true,
  result: {
    source_fees: breakdown(source),
    destination_fees: [breakdown(destination)]
  }
});

describe("TON deployment fee cap", () => {
  test("parses the one-TON target and three-TON hard ceiling exactly", () => {
    expect(parseTonLimitToNano("1")).toBe(1_000_000_000n);
    expect(parseTonLimitToNano("3")).toBe(3_000_000_000n);
  });

  test("accepts a valid estimate below the cap", () => {
    expect(enforceTonFeeCap(estimate("400000000", "500000000"), "3").totalFeeNano)
      .toBe(900_000_000n);
  });

  test("accepts an estimate exactly at the hard cap", () => {
    expect(enforceTonFeeCap(estimate("1000000000", "2000000000"), "3").totalFeeNano)
      .toBe(3_000_000_000n);
  });

  test("rejects an estimate above the hard cap", () => {
    expect(() => enforceTonFeeCap(estimate("1000000000", "2000000001"), "3"))
      .toThrow(/cap exceeded/i);
  });

  test("fails closed when estimate or fee components are missing", () => {
    expect(() => enforceTonFeeCap({} as TonCenterFeeEstimate, "3")).toThrow(/missing|unsuccessful/i);
    expect(() => enforceTonFeeCap(estimate("100", "0"), "3").totalFeeNano).not.toThrow();
    const malformed = estimate("100", "0");
    malformed.result.source_fees.gas_fee = "unknown";
    expect(() => enforceTonFeeCap(malformed, "3")).toThrow(/invalid or missing/i);
  });

  test("rejects malformed fee limits", () => {
    expect(() => parseTonLimitToNano("3.0000000001")).toThrow();
    expect(() => parseTonLimitToNano("-1")).toThrow();
  });
});
