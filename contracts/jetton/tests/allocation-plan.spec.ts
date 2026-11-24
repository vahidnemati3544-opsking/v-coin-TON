import fs from 'node:fs';
import path from 'node:path';

const planPath = path.join(__dirname, '..', 'allocation', 'allocation-plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const configPath = path.join(__dirname, '..', 'deployment.config.template.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

describe('VCOIN five-wallet allocation manifest', () => {
  test('defines exactly the five approved operational roles', () => {
    expect(plan.allocations.map((item: { role: string }) => item.role).sort()).toEqual([
      'ecosystem_marketing',
      'founder',
      'liquidity_market',
      'mining_reserve',
      'treasury',
    ]);
  });

  test('defines the exact five Founder-first receipt stages and prohibits public Testnet execution', () => {
    expect(plan.initialReceipt.network).toBe('mainnet');
    expect(plan.initialReceipt.founderReceivingWallet).toBe('UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT');
    expect(plan.initialReceipt.installments.map((item: { stage: number; amountTokens: string; amountBaseUnits: string }) => [
      item.stage, item.amountTokens, item.amountBaseUnits
    ])).toEqual([
      [1, '420000000', '420000000000000'],
      [2, '1050000000', '1050000000000000'],
      [3, '210000000', '210000000000000'],
      [4, '210000000', '210000000000000'],
      [5, '210000000', '210000000000000'],
    ]);
    expect(plan.initialReceipt.publicTestnetExecutionAuthorized).toBe(false);
    expect(plan.initialReceipt.simulationEnvironment).toBe('local_ton_sandbox_only');
    expect(plan.initialReceipt.testnetRehearsal).toBeUndefined();
    expect(plan.initialReceipt.status).toBe('five_stage_amounts_recorded_local_sandbox_only_mainnet_hold');
    expect(plan.releaseConstraints.some((item: string) => /No public TON Testnet deployment/i.test(item))).toBe(true);
  });

  test('allocations sum to 100 percent and the fixed 2.1 billion supply', () => {
    const percentTotal = plan.allocations.reduce((sum: number, item: { percent: number }) => sum + item.percent, 0);
    const baseUnitTotal = plan.allocations.reduce((sum: bigint, item: { amountBaseUnits: string }) => sum + BigInt(item.amountBaseUnits), 0n);
    expect(percentTotal).toBe(100);
    expect(baseUnitTotal).toBe(BigInt(plan.totalSupplyBaseUnits));
    expect(plan.totalSupplyTokens).toBe('2100000000');
    expect(plan.decimals).toBe(6);
  });

  test('each allocation matches its declared percentage exactly', () => {
    const supply = BigInt(plan.totalSupplyBaseUnits);
    for (const allocation of plan.allocations) {
      expect(BigInt(allocation.amountBaseUnits) * 100n).toBe(supply * BigInt(allocation.percent));
    }
  });

  test('uses five distinct destination environment-variable names', () => {
    const destinations = plan.allocations.map((item: { destinationEnv: string }) => item.destinationEnv);
    expect(new Set(destinations).size).toBe(5);
    for (const destination of destinations) {
      expect(destination).toMatch(/^VCOIN_[A-Z_]+_WALLET$/);
    }
  });

  test('Founder is the shared GAS & OPERATIONS wallet, not a sixth destination', () => {
    expect(config.operational_fee_wallet.owner_provided_address).toBe(config.allocation_wallets.founder);
    expect(config.operational_fee_wallet.is_vcoin_allocation_wallet).toBe(true);
    expect(config.release_intent.gas_operations_wallet_is_founder_wallet).toBe(true);
    expect(config.release_intent.gas_operations_wallet_is_not_an_allocation_wallet).toBe(false);
    expect(plan.releaseConstraints.some((item: string) => /separate GAS & OPERATIONS wallet/i.test(item))).toBe(false);
  });
});
