import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Address, beginCell, Cell } from '@ton/core';

const API_BASE = (process.env.TONCENTER_API_BASE || 'https://toncenter.com/api/v2').replace(/\/$/, '');
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

async function runGetMethod(address: string, method: string, stack: string[][] = []): Promise<ApiResult> {
  return readApi('runGetMethod', { address, method, stack });
}

function firstStackEntry(response: ApiResult): any {
  if (response.status !== 'ok') return null;
  return response.data?.stack?.[0] ?? null;
}

function decodeStackAddress(response: ApiResult): string | null {
  const entry = firstStackEntry(response);
  if (!entry) return null;
  try {
    const payload = Array.isArray(entry) ? entry[1] : entry;
    const value = typeof payload === 'string'
      ? payload
      : payload?.bytes ?? payload?.slice?.bytes ?? payload?.cell?.bytes;
    if (typeof value !== 'string') return null;
    const roots = Cell.fromBoc(Buffer.from(value, 'base64'));
    const slice = roots[0]?.beginParse();
    if (!slice) return null;
    return slice.loadAddress().toString({ urlSafe: true, bounceable: true, testOnly: false });
  } catch {
    return null;
  }
}

function decodeJettonInternalTransfer(bodyBoc: string | null | undefined) {
  if (!bodyBoc) return null;
  try {
    const roots = Cell.fromBoc(Buffer.from(bodyBoc, 'base64'));
    const slice = roots[0]?.beginParse();
    if (!slice || slice.remainingBits < 96) return null;
    const opcode = Number(slice.loadUint(32));
    if (opcode !== 0x178d4519) return null;
    const queryId = slice.loadUintBig(64).toString();
    const amount = slice.loadCoins().toString();
    return { opcode: '0x178d4519', query_id: queryId, amount_base_units: amount };
  } catch {
    return null;
  }
}

function decodeStackNumber(entry: any): string | null {
  if (!entry) return null;
  if (Array.isArray(entry)) {
    const kind = entry[0];
    const payload = entry[1];
    if (kind === 'num' || kind === 'tvm.Number') {
      if (typeof payload === 'string') {
        try { return BigInt(payload).toString(); } catch { return null; }
      }
      if (typeof payload === 'number' || typeof payload === 'bigint') return String(payload);
    }
    if (Array.isArray(payload?.elements)) return decodeStackNumber(payload.elements[0]);
    return null;
  }
  const raw = entry.number?.number ?? entry.number;
  if (typeof raw === 'string') {
    try { return BigInt(raw).toString(); } catch { return null; }
  }
  if (typeof raw === 'number' || typeof raw === 'bigint') return String(raw);
  if (Array.isArray(entry.elements)) return decodeStackNumber(entry.elements[0]);
  return null;
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
  const previouslyMisclassifiedTestnetWallet = 'UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy';
  const derivedMaster = derived.master.address as string;

  const founderInfoResponse = await readApi('getAddressInformation', { address: founder });
  const founderInfo = summarizeAccount(founder, founderInfoResponse);

  const reportedInfoResponse = await readApi('getAddressInformation', { address: reportedMaster });
  const reportedTokenResponse = await readApi('getTokenData', { address: reportedMaster });
  const reportedOwnerResponse = await runGetMethod(reportedMaster, 'get_gas_operator_wallet');
  const reportedReceiptResponse = await runGetMethod(reportedMaster, 'get_receipt_status');
  const founderOwnerCell = beginCell().storeAddress(Address.parse(founder)).endCell().toBoc().toString('base64');
  const reportedFounderWalletResponse = await runGetMethod(reportedMaster, 'get_wallet_address', [['tvm.Slice', founderOwnerCell]]);
  const reportedFounderJettonWallet = decodeStackAddress(reportedFounderWalletResponse);
  const reportedFounderJettonWalletInfoResponse = reportedFounderJettonWallet
    ? await readApi('getAddressInformation', { address: reportedFounderJettonWallet })
    : { status: 'unavailable' as const, error: 'Master get_wallet_address did not return a decodable address' };
  const reportedFounderWalletDataResponse = reportedFounderJettonWallet
    ? await runGetMethod(reportedFounderJettonWallet, 'get_wallet_data')
    : { status: 'unavailable' as const, error: 'Master get_wallet_address did not return a decodable address' };
  const reportedFounderWalletTransactionsResponse = reportedFounderJettonWallet
    ? await readApi('getTransactions', { address: reportedFounderJettonWallet, limit: 100, archival: true })
    : { status: 'unavailable' as const, error: 'Master get_wallet_address did not return a decodable address' };
  const founderReceiptMessages = reportedFounderWalletTransactionsResponse.status === 'ok' && Array.isArray(reportedFounderWalletTransactionsResponse.data)
    ? reportedFounderWalletTransactionsResponse.data
        .filter((tx: any) => tx.in_msg?.source && sameAddress(tx.in_msg.source, reportedMaster))
        .map((tx: any) => {
          const body = tx.in_msg?.msg_data?.body ?? tx.in_msg?.body ?? null;
          const decoded = decodeJettonInternalTransfer(body);
          if (!decoded) return null;
          const aborted = tx.description?.aborted ?? null;
          const computeSuccess = tx.description?.compute_ph?.success ?? tx.description?.compute?.success ?? null;
          const actionSuccess = tx.description?.action?.success ?? null;
          return {
            ...decoded,
            source_master: tx.in_msg.source,
            destination_jetton_wallet: tx.in_msg.destination ?? reportedFounderJettonWallet,
            transaction_lt: tx.transaction_id?.lt ?? null,
            transaction_hash: tx.transaction_id?.hash ?? null,
            timestamp_utc: tx.utime ? new Date(Number(tx.utime) * 1000).toISOString() : null,
            aborted,
            compute_success: computeSuccess,
            action_success: actionSuccess,
            credited_successfully: aborted === false && computeSuccess === true && actionSuccess === true,
          };
        })
        .filter((item: any) => item !== null)
    : [];
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
      admin_matches_previously_misclassified_testnet_label: sameAddress(token.admin_address, previouslyMisclassifiedTestnetWallet),
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
      owner_getter: {
        status: reportedOwnerResponse.status,
        error: reportedOwnerResponse.status === 'unavailable' ? reportedOwnerResponse.error : null,
        raw_stack: reportedOwnerResponse.status === 'ok' ? reportedOwnerResponse.data.stack : null,
        exit_code: reportedOwnerResponse.status === 'ok' ? reportedOwnerResponse.data.exit_code : null,
        decoded_owner_address: decodeStackAddress(reportedOwnerResponse),
        decoded_owner_is_founder: sameAddress(decodeStackAddress(reportedOwnerResponse), founder),
      },
      receipt_status_getter: {
        status: reportedReceiptResponse.status,
        error: reportedReceiptResponse.status === 'unavailable' ? reportedReceiptResponse.error : null,
        raw_stack: reportedReceiptResponse.status === 'ok' ? reportedReceiptResponse.data.stack : null,
        exit_code: reportedReceiptResponse.status === 'ok' ? reportedReceiptResponse.data.exit_code : null,
      },
      founder_jetton_wallet: {
        address: reportedFounderJettonWallet,
        address_getter: {
          status: reportedFounderWalletResponse.status,
          error: reportedFounderWalletResponse.status === 'unavailable' ? reportedFounderWalletResponse.error : null,
          exit_code: reportedFounderWalletResponse.status === 'ok' ? reportedFounderWalletResponse.data.exit_code : null,
          raw_stack: reportedFounderWalletResponse.status === 'ok' ? reportedFounderWalletResponse.data.stack : null,
        },
        account: reportedFounderJettonWalletInfoResponse.status === 'ok'
          ? summarizeAccount(reportedFounderJettonWallet!, reportedFounderJettonWalletInfoResponse)
          : { status: 'unavailable', error: reportedFounderJettonWalletInfoResponse.error },
        wallet_data_getter: {
          status: reportedFounderWalletDataResponse.status,
          error: reportedFounderWalletDataResponse.status === 'unavailable' ? reportedFounderWalletDataResponse.error : null,
          exit_code: reportedFounderWalletDataResponse.status === 'ok' ? reportedFounderWalletDataResponse.data.exit_code : null,
          raw_stack: reportedFounderWalletDataResponse.status === 'ok' ? reportedFounderWalletDataResponse.data.stack : null,
          first_stack_number: reportedFounderWalletDataResponse.status === 'ok'
            ? decodeStackNumber(firstStackEntry(reportedFounderWalletDataResponse))
            : null,
        },
        transaction_history: {
          status: reportedFounderWalletTransactionsResponse.status,
          error: reportedFounderWalletTransactionsResponse.status === 'unavailable' ? reportedFounderWalletTransactionsResponse.error : null,
          transactions_checked: reportedFounderWalletTransactionsResponse.status === 'ok' && Array.isArray(reportedFounderWalletTransactionsResponse.data)
            ? reportedFounderWalletTransactionsResponse.data.length
            : 0,
          incoming_master_receipt_messages: founderReceiptMessages,
          stage_receipts_confirmed: [1, 2, 3, 4, 5].map((stage) => {
            const expected = ['420000000000000', '1050000000000000', '210000000000000', '210000000000000', '210000000000000'][stage - 1];
            const matches = founderReceiptMessages.filter((message: any) => message.query_id === String(stage) && message.amount_base_units === expected && message.credited_successfully === true);
            return { stage, expected_amount_base_units: expected, confirmed_count: matches.length, transaction_hashes: matches.map((message: any) => message.transaction_hash) };
          }),
        },
      },
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
