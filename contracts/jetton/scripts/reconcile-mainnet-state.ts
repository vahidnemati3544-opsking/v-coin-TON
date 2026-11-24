import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Address, Cell } from '@ton/core';

const API_BASE = (process.env.TONCENTER_API_BASE || 'https://toncenter.com/api/v2').replace(/\\/$/, '');
const API_KEY = process.env.TONCENTER_API_KEY;
const WAIT_MS = 1250;

type ApiResult = { status: 'ok'; data: any } | { status: 'unavailable'; error: string };

function delay(ms: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function formatNano(value: string | number | bigint | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  try {
    const n = BigInt(value);
    const whole = n / 1_000_000_000n;
    const fraction = (n % 1_000_000_000n).toString().padStart(9, '0').replace(/0+$/, '');
    return fraction ? whole.toString() + '.' + fraction : whole.toString();
  } catch {
    return null;
  }
}

function formatTokenUnits(value: string | number | null | undefined, decimals: number): string | null {
  if (value === null || value === undefined) return null;
  try {
    const n = BigInt(value);
    const scale = 10n ** BigInt(decimals);
    const whole = n / scale;
    const fraction = (n % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
    return fraction ? whole.toString() + '.' + fraction : whole.toString();
  } catch {
    return null;
  }
}

function cellHashFromBoc(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const roots = Cell.fromBoc(Buffer.from(value, 'base64'));
    return roots[0]?.hash().toString('hex') ?? null;
  } catch {
    return null;
  }
}

function sameAddress(a: string | null | undefined, b: string | null | undefined): boolean | null {
  if (!a || !b) return null;
  try {
    return Address.parse(a).toRawString() === Address.parse(b).toRawString();
  } catch {
    return null;
  }
}

let requestCount = 0;

async function readApi(method: string, body: Record<string, unknown>): Promise<ApiResult> {
  if (requestCount > 0) await delay(WAIT_MS);
  requestCount += 1;
  let lastError = 'Unknown API error';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (API_KEY) headers['X-API-Key'] = API_KEY;
      const response = await fetch(API_BASE + '/' + method, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const raw = await response.text();
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('Non-JSON response, HTTP ' + response.status);
      }
      if (!response.ok || parsed.ok !== true) {
        throw new Error('HTTP ' + response.status + ': ' + String(parsed.error ?? parsed.description ?? raw).slice(0, 400));
      }
      return { status: 'ok', data: parsed.result };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < 2) await delay(2000 * (attempt + 1));
    }
  }
  return { status: 'unavailable', error: lastError };
}

function summarizeAccount(address: string, response: ApiResult) {
  if (response.status !== 'ok') return { address, status: 'unavailable', error: response.error };
  const info = response.data ?? {};
  return {
    address,
    status: info.state ?? info.account_state ?? 'unknown',
    balance_nanotons: info.balance ?? null,
    balance_ton: formatNano(info.balance),
    code_hash: cellHashFromBoc(info.code),
    data_hash: cellHashFromBoc(info.data),
    last_transaction_id: info.last_transaction_id ?? null,
    block_id: info.block_id ?? null,
  };
}

async function main() {
  const config = JSON.parse(readFileSync(resolve(__dirname, '../deployment.config.template.json'), 'utf8'));
  const derived = JSON.parse(readFileSync(resolve(__dirname, '../build/mainnet-address-derivation.json'), 'utf8'));
  const founder = config.allocation_wallets.founder as string;
  const reportedMaster = 'EQBn4hW8bKhFTSz9riY5q3Pr3SfJmv2VYKZQl_NWMbK--5fP';
  const derivedMaster = derived.master.address as string;

  const founderInfoResponse = await readApi('getAddressInformation', { address: founder });
  const founderInfo = summarizeAccount(founder, founderInfoResponse);

  const reportedInfoResponse = await readApi('getAddressInformation', { address: reportedMaster });
  const reportedTokenResponse = await readApi('getTokenData', { address: reportedMaster });
  const derivedInfoResponse = await readApi('getAddressInformation', { address: derivedMaster });
  const derivedTokenResponse = await readApi('getTokenData', { address: derivedMaster });

  const reportedAccount = summarizeAccount(reportedMaster, reportedInfoResponse);
  const derivedAccount = summarizeAccount(derivedMaster, derivedInfoResponse);

  const summarizeToken = (response: ApiResult) => {
    if (response.status !== 'ok') return { status: 'unavailable', error: response.error };
    const token = response.data ?? {};
    return {
      status: 'ok',
      contract_type: token.contract_type ?? null,
      total_supply_base_units: token.total_supply ?? null,
      total_supply_tokens: formatTokenUnits(token.total_supply, Number(config.decimals)),
      mintable: token.mintable ?? null,
      admin_address: token.admin_address ?? null,
      admin_is_founder: sameAddress(token.admin_address, founder),
      jetton_content_type: token.jetton_content?.type ?? null,
      jetton_content: token.jetton_content ?? null,
    };
  };

  const report = {
    project: config.project,
    purpose: 'Read-only TON Mainnet reconciliation of the prior Tonkeeper-reported Master, the exact-build derived Master candidate, and Founder GAS wallet. No transaction is created, signed, or broadcast.',
    network: 'mainnet',
    checked_at_utc: new Date().toISOString(),
    source_commit: process.env.GITHUB_SHA ?? 'local-uncommitted-build',
    api_endpoint: API_BASE,
    api_key_configured: Boolean(API_KEY),
    requests_made: requestCount,
    founder_wallet: founderInfo,
    reported_tonkeeper_master: {
      account: reportedAccount,
      jetton_data: summarizeToken(reportedTokenResponse),
    },
    exact_build_derived_master: {
      account: derivedAccount,
      jetton_data: summarizeToken(derivedTokenResponse),
      expected_code_hash: derived.master.code_hash,
      expected_data_hash: derived.master.data_hash,
      expected_state_init_hash: derived.master.state_init_hash,
      observed_code_matches_exact_build: derivedAccount.code_hash
        ? derivedAccount.code_hash === derived.master.code_hash
        : null,
      observed_data_matches_exact_build: derivedAccount.data_hash
        ? derivedAccount.data_hash === derived.master.data_hash
        : null,
    },
    address_identity_reconciled: reportedMaster === derivedMaster,
    transaction_created: false,
    transaction_signed: false,
    transaction_broadcast: false,
    deployment_authorized: false,
    mainnet_authorized: false,
  };

  const outputPath = resolve(__dirname, '../build/mainnet-state-reconciliation.json');
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({
    output: 'build/mainnet-state-reconciliation.json',
    network: report.network,
    founder_account_status: founderInfo.status,
    founder_balance_ton: founderInfo.balance_ton,
    reported_master_status: reportedAccount.status,
    reported_master_code_hash: reportedAccount.code_hash,
    reported_master_token_type: (report.reported_tonkeeper_master.jetton_data as any).contract_type ?? null,
    reported_master_supply: (report.reported_tonkeeper_master.jetton_data as any).total_supply_tokens ?? null,
    derived_master_status: derivedAccount.status,
    derived_master_observed_code_matches_build: report.exact_build_derived_master.observed_code_matches_exact_build,
    api_requests: requestCount,
    transaction_created: false,
    transaction_signed: false,
    transaction_broadcast: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
