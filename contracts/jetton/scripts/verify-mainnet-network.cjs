const { Cell } = require("@ton/core");

const MAINNET_GLOBAL_ID = -239;
const CONFIG_PARAM_GLOBAL_ID = 19;
const ENDPOINT = "https://toncenter.com/api/v2/getConfigParam";

async function main() {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ config_id: CONFIG_PARAM_GLOBAL_ID }),
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("TON Mainnet config endpoint HTTP " + response.status);
  const payload = await response.json();
  if (payload.ok !== true || typeof payload.result?.config?.bytes !== "string") {
    throw new Error("TON Mainnet endpoint returned an invalid getConfigParam response");
  }

  const cells = Cell.fromBoc(Buffer.from(payload.result.config.bytes, "base64"));
  if (cells.length !== 1) throw new Error("Unexpected ConfigParam 19 BoC cell count");
  const slice = cells[0].beginParse();
  if (slice.remainingBits !== 32 || slice.remainingRefs !== 0) {
    throw new Error("ConfigParam 19 does not match the expected signed int32 schema");
  }
  const globalId = Number(slice.loadInt(32));
  if (globalId !== MAINNET_GLOBAL_ID) {
    throw new Error("STOP: endpoint is not TON Mainnet; ConfigParam 19 global_id=" + globalId);
  }

  console.log(JSON.stringify({
    status: "PASS",
    endpoint: ENDPOINT,
    config_param: CONFIG_PARAM_GLOBAL_ID,
    global_id: globalId,
    network: "TON Mainnet",
    checked_at_utc: new Date().toISOString(),
    read_only: true,
    transaction_created: false,
    transaction_signed: false,
    transaction_broadcast: false,
    warning: "This is a point-in-time read-only network check. Re-run immediately before any separately approved transaction and confirm the wallet network independently."
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
