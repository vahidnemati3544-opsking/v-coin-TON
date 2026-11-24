import { Blockchain, SandboxContract, TreasuryContract, createShardAccount } from '@ton/sandbox';
import { Address, Cell, toNano } from '@ton/core';
import '@ton/test-utils';
import { VCoinMaster } from '../build/VCoinMaster_VCoinMaster';
import { VCoinJettonWallet } from '../build/VCoinMaster_VCoinJettonWallet';
import { BounceRejector } from '../build-test/BounceRejector_BounceRejector';

const MAX_SUPPLY = 2_100_000_000_000_000n;
const STAGE_ONE = 1_000_000_000_000_000n;
const STAGE_TWO = MAX_SUPPLY - STAGE_ONE;

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

async function founderWallet(blockchain: Blockchain, master: SandboxContract<ReturnType<typeof VCoinMaster>>, owner: SandboxContract<TreasuryContract>) {
  const address = await master.getGetWalletAddress(owner.address);
  return blockchain.openContract(VCoinJettonWallet.fromAddress(address));
}

describe('VCOIN Founder-first two-stage issuance', () => {
  test('only Founder can initiate Stage 1 and it credits only the Founder Jetton wallet', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const attacker = await chain.treasury('attacker');
    const master = await deployMaster(chain, owner);
    const denied = await master.send(attacker.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_ONE,
    });
    expect(denied.transactions).toHaveTransaction({ to: master.address, success: false });
    expect((await master.getGetJettonData()).total_supply).toBe(0n);

    const stage1 = await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_ONE,
    });
    expect(stage1.transactions).toHaveTransaction({ from: owner.address, to: master.address, success: true });
    expect((await master.getGetJettonData()).total_supply).toBe(STAGE_ONE);
    expect((await (await founderWallet(chain, master, owner)).getGetWalletData()).balance).toBe(STAGE_ONE);
    const status = await master.getGetReceiptStatus();
    expect(status.first_receipt_issued).toBe(true);
    expect(status.second_receipt_issued).toBe(false);
    expect(status.remaining_supply).toBe(STAGE_TWO);
  });

  test('Stage 2 must equal the exact remainder; after it, minting is permanently disabled', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const master = await deployMaster(chain, owner);
    await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_ONE,
    });
    const wrong = await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_TWO - 1n,
    });
    expect(wrong.transactions).toHaveTransaction({ to: master.address, success: false });
    expect((await master.getGetJettonData()).total_supply).toBe(STAGE_ONE);

    const stage2 = await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_TWO,
    });
    expect(stage2.transactions).toHaveTransaction({ from: owner.address, to: master.address, success: true });
    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(MAX_SUPPLY);
    expect(data.mintable).toBe(false);
    const wallet = await founderWallet(chain, master, owner);
    expect((await wallet.getGetWalletData()).balance).toBe(MAX_SUPPLY);

    const extra = await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: 1n,
    });
    expect(extra.transactions).toHaveTransaction({ to: master.address, success: false });
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
  });

  test('rejects non-Founder recipients, zero amount, full-supply Stage 1 and repeat Stage 1', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const other = await chain.treasury('other');
    const master = await deployMaster(chain, owner);
    for (const [receiver, amount] of [[other.address, STAGE_ONE], [owner.address, 0n], [owner.address, MAX_SUPPLY]] as const) {
      const rejected = await master.send(owner.getSender(), { value: toNano('0.5') }, {
        $$type: 'VCoinMint', receiver, amount,
      });
      expect(rejected.transactions).toHaveTransaction({ to: master.address, success: false });
    }
    await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_ONE,
    });
    const repeated = await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_ONE,
    });
    expect(repeated.transactions).toHaveTransaction({ to: master.address, success: false });
    expect((await master.getGetJettonData()).total_supply).toBe(STAGE_ONE);
  });

  test('Founder can distribute the credited Jettons to the four registered destination wallets', async () => {
    const chain = await Blockchain.create();
    const owner = await chain.treasury('owner');
    const mining = await chain.treasury('mining');
    const treasury = await chain.treasury('treasury');
    const liquidity = await chain.treasury('liquidity');
    const ecosystem = await chain.treasury('ecosystem');
    const master = await deployMaster(chain, owner);
    await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_ONE,
    });
    await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_TWO,
    });
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

  test('a natural Stage 1 bounce rolls back only Stage 1 and permits a safe retry', async () => {
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
    const bounced = await master.send(owner.getSender(), { value: toNano('0.5') }, {
      $$type: 'VCoinMint', receiver: owner.address, amount: STAGE_ONE,
    });
    expect(bounced.transactions).toHaveTransaction({
      from: walletAddress, to: master.address, inMessageBounced: true, success: true,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(0n);
    expect((await master.getGetReceiptStatus()).first_receipt_issued).toBe(false);
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
