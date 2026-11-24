import { Blockchain, SandboxContract, TreasuryContract, createShardAccount } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import '@ton/test-utils';
import { VCoinMaster } from '../build/VCoinMaster_VCoinMaster';
import { VCoinJettonWallet } from '../build/VCoinMaster_VCoinJettonWallet';
import { BounceRejector } from '../build-test/BounceRejector_BounceRejector';

const STAGES = [
  420_000_000_000_000n,
  1_050_000_000_000_000n,
  210_000_000_000_000n,
  210_000_000_000_000n,
  210_000_000_000_000n,
] as const;
const MAX_SUPPLY = 2_100_000_000_000_000n;

async function deployMaster(blockchain: Blockchain, owner: SandboxContract<TreasuryContract>, fund = true) {
  const master = blockchain.openContract(await VCoinMaster.fromInit(owner.address, Cell.EMPTY));
  const deployment = await master.send(owner.getSender(), { value: toNano('0.1') }, {
    $$type: 'ProvideWalletAddress', query_id: 1n, owner_address: owner.address, include_address: false,
  });
  expect(deployment.transactions).toHaveTransaction({ to: master.address, success: true });
  if (fund) {
    const funding = await master.send(owner.getSender(), { value: toNano('1') }, { $$type: 'VCoinFund' });
    expect(funding.transactions).toHaveTransaction({ from: owner.address, to: master.address, success: true });
  }
  return master;
}
async function founderWallet(blockchain: Blockchain, master: any, owner: any) {
  const address = await master.getGetWalletAddress(owner.address);
  return blockchain.openContract(VCoinJettonWallet.fromAddress(address));
}
async function issueStage(master: any, owner: any, stage: number) {
  return master.send(owner.getSender(), { value: toNano('0.5') }, {
    $$type: 'VCoinMint', receiver: owner.address, amount: STAGES[stage - 1],
  });
}

describe('VCOIN five-stage Founder-first issuance', () => {
  test('only Founder can initiate exact Stage 1 and it credits only the Founder wallet', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const attacker = await chain.treasury('attacker');
    const master = await deployMaster(chain, owner);
    const denied = await master.send(attacker.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGES[0],
    });
    expect(denied.transactions).toHaveTransaction({ to: master.address, success: false });
    expect((await master.getGetJettonData()).total_supply).toBe(0n);
    const wrongAmount = await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGES[0] + 1n,
    });
    expect(wrongAmount.transactions).toHaveTransaction({ to: master.address, success: false });
    const stage1 = await issueStage(master, owner, 1);
    expect(stage1.transactions).toHaveTransaction({ from: owner.address, to: master.address, success: true });
    expect((await master.getGetJettonData()).total_supply).toBe(STAGES[0]);
    expect((await (await founderWallet(chain, master, owner)).getGetWalletData()).balance).toBe(STAGES[0]);
    const status = await master.getGetReceiptStatus();
    expect(status.stage_1_confirmed).toBe(true);
    expect(status.next_receipt_stage).toBe(2n);
    expect(status.receipt_pending).toBe(false);
    expect(status.remaining_supply).toBe(MAX_SUPPLY - STAGES[0]);
  });

  test('all five exact stages are credited to Founder in sequence and minting is disabled after Stage 5', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const master = await deployMaster(chain, owner);
    let total = 0n;
    for (let i = 0; i < STAGES.length; i++) {
      const result = await issueStage(master, owner, i + 1);
      expect(result.transactions).toHaveTransaction({ from: owner.address, to: master.address, success: true });
      total += STAGES[i];
      expect((await master.getGetJettonData()).total_supply).toBe(total);
      const status = await master.getGetReceiptStatus();
      expect(status.next_receipt_stage).toBe(BigInt(i + 2));
      expect(status.receipt_pending).toBe(false);
      const confirmations = [status.stage_1_confirmed, status.stage_2_confirmed, status.stage_3_confirmed, status.stage_4_confirmed, status.stage_5_confirmed];
      expect(confirmations[i]).toBe(true);
    }
    expect(total).toBe(MAX_SUPPLY);
    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(MAX_SUPPLY);
    expect(data.mintable).toBe(false);
    expect((await (await founderWallet(chain, master, owner)).getGetWalletData()).balance).toBe(MAX_SUPPLY);
    const extra = await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: 1n,
    });
    expect(extra.transactions).toHaveTransaction({ to: master.address, success: false });
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
  });

  test('rejects out-of-order stages, wrong recipients, zero, duplicate stages and extra supply', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const other = await chain.treasury('other');
    const master = await deployMaster(chain, owner);
    const cases = [
      { receiver: owner.address, amount: STAGES[1] },
      { receiver: other.address, amount: STAGES[0] },
      { receiver: owner.address, amount: 0n },
      { receiver: owner.address, amount: MAX_SUPPLY },
    ] as const;
    for (const item of cases) {
      const rejected = await master.send(owner.getSender(), { value: toNano('0.5') }, {
        $$type: 'VCoinMint', receiver: item.receiver, amount: item.amount,
      });
      expect(rejected.transactions).toHaveTransaction({ to: master.address, success: false });
    }
    await issueStage(master, owner, 1);
    const repeated = await issueStage(master, owner, 1);
    expect(repeated.transactions).toHaveTransaction({ to: master.address, success: false });
    expect((await master.getGetJettonData()).total_supply).toBe(STAGES[0]);
  });

  test('Founder can retry an acknowledgement without double-issuing or advancing twice', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const master = await deployMaster(chain, owner);
    await issueStage(master, owner, 1);
    const wallet = await founderWallet(chain, master, owner);
    const retry = await wallet.send(owner.getSender(), { value: toNano('0.03') }, {
      $$type: 'VCoinRetryReceiptAcknowledgement',
    });
    expect(retry.transactions).toHaveTransaction({ from: owner.address, to: wallet.address, success: true });
    expect((await master.getGetReceiptStatus()).next_receipt_stage).toBe(2n);
    expect((await master.getGetJettonData()).total_supply).toBe(STAGES[0]);
    expect((await wallet.getGetWalletData()).balance).toBe(STAGES[0]);
  });

  test('Founder can distribute four registered allocations only after all five receipts', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const mining = await chain.treasury('mining');
    const treasury = await chain.treasury('treasury');
    const liquidity = await chain.treasury('liquidity');
    const ecosystem = await chain.treasury('ecosystem');
    const master = await deployMaster(chain, owner);
    for (let stage = 1; stage <= 5; stage++) await issueStage(master, owner, stage);
    const wallet = await founderWallet(chain, master, owner);
    const shares = [
      [mining.address, 1_050_000_000_000_000n],
      [treasury.address, 210_000_000_000_000n],
      [liquidity.address, 210_000_000_000_000n],
      [ecosystem.address, 210_000_000_000_000n],
    ] as const;
    for (const [destination, amount] of shares) {
      const result = await wallet.send(owner.getSender(), { value: toNano('0.15') }, {
        $$type: 'TokenTransfer', query_id: BigInt(shares.findIndex(x => x[0] === destination) + 1),
        amount, destination, response_destination: owner.address, custom_payload: null,
        forward_ton_amount: 0n, forward_payload: Cell.EMPTY.beginParse(),
      });
      expect(result.transactions).toHaveTransaction({ from: owner.address, to: wallet.address, success: true });
      const destinationAddress = await master.getGetWalletAddress(destination);
      const destinationWallet = chain.openContract(VCoinJettonWallet.fromAddress(destinationAddress));
      expect((await destinationWallet.getGetWalletData()).balance).toBe(amount);
    }
    expect((await wallet.getGetWalletData()).balance).toBe(420_000_000_000_000n);
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
  });

  test('a natural Stage 1 bounce rolls back only Stage 1 and permits retry', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const master = await deployMaster(chain, owner);
    const walletAddress = await master.getGetWalletAddress(owner.address);
    const rejector = await BounceRejector.fromInit();
    if (!rejector.init) throw new Error('BounceRejector StateInit missing');
    await chain.setShardAccount(walletAddress, createShardAccount({
      address: walletAddress, code: rejector.init.code, data: rejector.init.data,
      balance: toNano('1'), workchain: 0,
    }));
    const bounced = await issueStage(master, owner, 1);
    expect(bounced.transactions).toHaveTransaction({
      from: walletAddress, to: master.address, inMessageBounced: true, success: true,
    });
    const status = await master.getGetReceiptStatus();
    expect((await master.getGetJettonData()).total_supply).toBe(0n);
    expect(status.next_receipt_stage).toBe(1n);
    expect(status.receipt_pending).toBe(false);
    expect(status.stage_1_confirmed).toBe(false);

    const restoredWallet = await VCoinJettonWallet.fromInit(owner.address, master.address);
    if (!restoredWallet.init) throw new Error('Founder Jetton Wallet StateInit missing for retry');
    await chain.setShardAccount(walletAddress, createShardAccount({
      address: walletAddress, code: restoredWallet.init.code, data: restoredWallet.init.data,
      balance: toNano('1'), workchain: 0,
    }));
    const retried = await issueStage(master, owner, 1);
    expect(retried.transactions).toHaveTransaction({ from: owner.address, to: master.address, success: true });
    expect((await master.getGetJettonData()).total_supply).toBe(STAGES[0]);
    expect((await (await founderWallet(chain, master, owner)).getGetWalletData()).balance).toBe(STAGES[0]);
    expect((await master.getGetReceiptStatus()).next_receipt_stage).toBe(2n);
  });

  test('a natural Stage 2 bounce preserves Stage 1 and makes only Stage 2 retryable', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const master = await deployMaster(chain, owner);
    await issueStage(master, owner, 1);
    const walletAddress = await master.getGetWalletAddress(owner.address);
    const rejector = await BounceRejector.fromInit();
    if (!rejector.init) throw new Error('BounceRejector StateInit missing');
    await chain.setShardAccount(walletAddress, createShardAccount({
      address: walletAddress, code: rejector.init.code, data: rejector.init.data,
      balance: toNano('1'), workchain: 0,
    }));
    const bounced = await issueStage(master, owner, 2);
    expect(bounced.transactions).toHaveTransaction({
      from: walletAddress, to: master.address, inMessageBounced: true, success: true,
    });
    const status = await master.getGetReceiptStatus();
    expect((await master.getGetJettonData()).total_supply).toBe(STAGES[0]);
    expect(status.next_receipt_stage).toBe(2n);
    expect(status.receipt_pending).toBe(false);
    expect(status.stage_1_confirmed).toBe(true);
    expect(status.stage_2_confirmed).toBe(false);
    expect(status.remaining_supply).toBe(MAX_SUPPLY - STAGES[0]);
  });

  test('Founder alone may fund and withdraw Master operational TON within reserve limits', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const attacker = await chain.treasury('attacker');
    const master = await deployMaster(chain, owner, false);
    const rejected = await master.send(attacker.getSender(), { value: toNano('1') }, { $$type: 'VCoinFund' });
    expect(rejected.transactions).toHaveTransaction({ to: master.address, success: false });
    const funded = await master.send(owner.getSender(), { value: toNano('0.75') }, { $$type: 'VCoinFund' });
    expect(funded.transactions).toHaveTransaction({ from: owner.address, to: master.address, success: true });
    const withdrawal = await master.send(owner.getSender(), { value: toNano('0.02') }, {
      $$type: 'VCoinWithdraw', amount: toNano('0.1'),
    });
    expect(withdrawal.transactions).toHaveTransaction({ from: master.address, to: owner.address, success: true });
  });
});
