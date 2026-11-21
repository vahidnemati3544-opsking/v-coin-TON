export type TonFeeBreakdown = {
  in_fwd_fee: string | number;
  storage_fee: string | number;
  gas_fee: string | number;
  fwd_fee: string | number;
};

export type TonCenterFeeEstimate = {
  ok: true;
  result: {
    source_fees: TonFeeBreakdown;
    destination_fees: TonFeeBreakdown[];
  };
};

const NANO_PER_TON = 1_000_000_000n;
const REQUIRED_FEE_FIELDS = ["in_fwd_fee", "storage_fee", "gas_fee", "fwd_fee"] as const;

function feeInteger(value: string | number, label: string): bigint {
  const raw = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(raw)) {
    throw new Error(`Invalid or missing TON fee component: ${label}`);
  }
  return BigInt(raw);
}

function sumBreakdown(breakdown: TonFeeBreakdown, label: string): bigint {
  if (!breakdown || typeof breakdown !== "object") {
    throw new Error(`Missing TON fee breakdown: ${label}`);
  }
  return REQUIRED_FEE_FIELDS.reduce(
    (sum, field) => sum + feeInteger(breakdown[field], `${label}.${field}`),
    0n
  );
}

export function parseTonLimitToNano(value: string): bigint {
  if (!/^(0|[1-9][0-9]*)(\\.[0-9]{1,9})?$/.test(value)) {
    throw new Error("TON fee limit must be a non-negative decimal with at most 9 fractional digits.");
  }
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * NANO_PER_TON + BigInt((fraction + "000000000").slice(0, 9));
}

/**
 * Fail-closed gate for TON Center estimateFee responses.
 * Sums every source and destination fee component. Attached message value is
 * deliberately excluded: it is funding/value, not itself a network fee.
 */
export function enforceTonFeeCap(
  estimate: TonCenterFeeEstimate,
  maxTotalFeeTon: string
): { totalFeeNano: bigint; maxFeeNano: bigint; totalFeeTon: string; withinCap: true } {
  if (!estimate || estimate.ok !== true || !estimate.result) {
    throw new Error("Missing or unsuccessful TON fee estimate; refusing to proceed.");
  }
  const { source_fees, destination_fees } = estimate.result;
  if (!Array.isArray(destination_fees) || destination_fees.length === 0) {
    throw new Error("Missing destination fee breakdown; refusing to proceed.");
  }
  const totalFeeNano =
    sumBreakdown(source_fees, "source_fees") +
    destination_fees.reduce((sum, item, index) => sum + sumBreakdown(item, `destination_fees[${index}]`), 0n);
  const maxFeeNano = parseTonLimitToNano(maxTotalFeeTon);
  if (totalFeeNano > maxFeeNano) {
    throw new Error(`TON fee cap exceeded: estimated ${totalFeeNano} nanoTON; maximum ${maxFeeNano} nanoTON.`);
  }
  return {
    totalFeeNano,
    maxFeeNano,
    totalFeeTon: `${totalFeeNano / NANO_PER_TON}.${(totalFeeNano % NANO_PER_TON).toString().padStart(9, "0")}`,
    withinCap: true
  };
}
