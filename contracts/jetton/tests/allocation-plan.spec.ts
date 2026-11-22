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
});
