import { Blockchain, SandboxContract, TreasuryContract, createShardAccount } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import '@ton/test-utils';
import { VCoinMaster } from '../build/VCoinMaster_VCoinMaster';
import { VCoinJettonWallet } from '../build/VCoinMaster_VCoinJettonWallet';
import { BounceRejector } from '../build-test/BounceRejector_BounceRejector';

const FOUNDER_ALLOCATION = 2_000_000_000_000_000n;
const MINING_ALLOCATION = 5_000_000_000_000_000n;
const ONE_BILLION_ALLOCATION = 1_000_000_000_000_000n;
const MAX_SUPPLY = 10_000_000_000_000_000n;

async function deployMaster(
  blockchain: Blockchain,
  owner: SandboxContract<TreasuryContract>,
  fundMaster: boolean = true,
) {
  const miningReserve = await blockchain.treasury('mining-reserve');
  const treasury = await blockchain.treasury('treasury');
  const liquidity = await blockchain.treasury('liquidity');
  const ecosystem = await blockchain.treasury('ecosystem');
  const gasOperator = await blockchain.treasury('gas-operations');
  const master = blockchain.openContract(
    await VCoinMaster.fromInit(
      owner.address,
      Cell.EMPTY,
      miningReserve.address,
      treasury.address,
      liquidity.address,
      ecosystem.address,
      gasOperator.address,
    ),
  );
  const deployment = await master.send(
    gasOperator.getSender(),
    { value: toNano('0.1') },
    {
      $$type: 'ProvideWalletAddress',
      query_id: 1n,
      owner_address: owner.address,
      include_address: false,
    },
  );
  expect(deployment.transactions).toHaveTransaction({
    to: master.address,
    success: true,
  });
  if (fundMaster) {
    const funding = await master.send(
      gasOperator.getSender(),
      { value: toNano('0.75') },
      { $$type: 'VCoinFund' },
    );
    expect(funding.transactions).toHaveTransaction({
      from: gasOperator.address,
      to: master.address,
      success: true,
    });
  }
  return { master, miningReserve, treasury, liquidity, ecosystem, gasOperator };
}

describe('VCOIN Jetton Sandbox release gates', () => {
  test('allows only the owner to issue each exact fixed allocation once', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const attacker = await blockchain.treasury('attacker');
    const { master } = await deployMaster(blockchain, owner);

    const unauthorized = await master.send(
      attacker.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: FOUNDER_ALLOCATION },
    );
    expect(unauthorized.transactions).toHaveTransaction({
      to: master.address,
      success: false,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(0n);

    const issued = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: FOUNDER_ALLOCATION },
    );
    expect(issued.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });

    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(FOUNDER_ALLOCATION);
    expect(data.mintable).toBe(true);

    const walletAddress = await master.getGetWalletAddress(owner.address);
    const wallet = blockchain.openContract(VCoinJettonWallet.fromAddress(walletAddress));
    expect((await wallet.getGetWalletData()).balance).toBe(FOUNDER_ALLOCATION);

    const repeated = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: FOUNDER_ALLOCATION },
    );
    expect(repeated.transactions).toHaveTransaction({
      to: master.address,
      success: false,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(FOUNDER_ALLOCATION);
  });

  test('accepts Master gas funding only from the separate GAS & OPERATIONS wallet', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const attacker = await blockchain.treasury('attacker');
    const { master, gasOperator } = await deployMaster(blockchain, owner, false);

    const unauthorizedFunding = await master.send(
      attacker.getSender(),
      { value: toNano('1') },
      { $$type: 'VCoinFund' },
    );
    expect(unauthorizedFunding.transactions).toHaveTransaction({
      to: master.address,
      success: false,
    });

    const authorizedFunding = await master.send(
      gasOperator.getSender(),
      { value: toNano('0.75') },
      { $$type: 'VCoinFund' },
    );
    expect(authorizedFunding.transactions).toHaveTransaction({
      from: gasOperator.address,
      to: master.address,
      success: true,
    });

    const issued = await master.send(
      owner.getSender(),
      { value: toNano('0.01') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: FOUNDER_ALLOCATION },
    );
    expect(issued.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(FOUNDER_ALLOCATION);
  });

  test('rejects an underfunded allocation before changing supply', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const { master } = await deployMaster(blockchain, owner, false);

    const underfunded = await master.send(
      owner.getSender(),
      { value: toNano('0.01') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: FOUNDER_ALLOCATION },
    );
    expect(underfunded.transactions).toHaveTransaction({
      to: master.address,
      success: false,
    });
    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(0n);
    expect(data.mintable).toBe(true);
  });

  test('accepts a 0.01 TON owner request using the separate Master gas reserve', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const { master } = await deployMaster(blockchain, owner);

    const result = await master.send(
      owner.getSender(),
      { value: toNano('0.01') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: FOUNDER_ALLOCATION },
    );
    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });
    const walletAddress = await master.getGetWalletAddress(owner.address);
    const wallet = blockchain.openContract(VCoinJettonWallet.fromAddress(walletAddress));
    expect((await wallet.getGetWalletData()).balance).toBe(FOUNDER_ALLOCATION);
  });

  test('rejects wrong amounts and unregistered recipient addresses', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const other = await blockchain.treasury('other');
    const { master } = await deployMaster(blockchain, owner);

    const wrongAmount = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: MAX_SUPPLY - 1n },
    );
    expect(wrongAmount.transactions).toHaveTransaction({ to: master.address, success: false });

    const unregistered = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: other.address, amount: FOUNDER_ALLOCATION },
    );
    expect(unregistered.transactions).toHaveTransaction({ to: master.address, success: false });
    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(0n);
    expect(data.mintable).toBe(true);
  });

  test('distributes exactly the five immutable allocations and then disables issuance', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const { master, miningReserve, treasury, liquidity, ecosystem, gasOperator } = await deployMaster(blockchain, owner);

    const expected = [
      { address: owner.address, amount: FOUNDER_ALLOCATION },
      { address: miningReserve.address, amount: MINING_ALLOCATION },
      { address: treasury.address, amount: ONE_BILLION_ALLOCATION },
      { address: liquidity.address, amount: ONE_BILLION_ALLOCATION },
      { address: ecosystem.address, amount: ONE_BILLION_ALLOCATION },
    ];

    const config = await master.getGetAllocationConfig();
    expect(config.founder_wallet.toString()).toBe(owner.address.toString());
    expect(config.mining_reserve_wallet.toString()).toBe(miningReserve.address.toString());
    expect(config.treasury_wallet.toString()).toBe(treasury.address.toString());
    expect(config.liquidity_wallet.toString()).toBe(liquidity.address.toString());
    expect(config.ecosystem_wallet.toString()).toBe(ecosystem.address.toString());
    expect((await master.getGetGasOperatorWallet()).toString()).toBe(gasOperator.address.toString());

    for (const allocation of expected) {
      const result = await master.send(
        owner.getSender(),
        { value: toNano('0.01') },
        { $$type: 'VCoinMint', receiver: allocation.address, amount: allocation.amount },
      );
      expect(result.transactions).toHaveTransaction({
        from: owner.address,
        to: master.address,
        success: true,
      });
    }

    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(MAX_SUPPLY);
    expect(data.mintable).toBe(false);

    const status = await master.getGetAllocationStatus();
    expect(status).toEqual({
      $$type: 'VCoinAllocationStatus',
      founder_issued: true,
      mining_reserve_issued: true,
      treasury_issued: true,
      liquidity_issued: true,
      ecosystem_issued: true,
    });

    for (const allocation of expected) {
      const walletAddress = await master.getGetWalletAddress(allocation.address);
      const wallet = blockchain.openContract(VCoinJettonWallet.fromAddress(walletAddress));
      expect((await wallet.getGetWalletData()).balance).toBe(allocation.amount);
    }
  });

  test('rolls back each role-specific allocation after a natural wallet-credit bounce', async () => {
    const roles = [
      { statusField: 'founder_issued', select: (d: Awaited<ReturnType<typeof deployMaster>>, owner: SandboxContract<TreasuryContract>) => ({ address: owner.address, amount: FOUNDER_ALLOCATION }) },
      { statusField: 'mining_reserve_issued', select: (d: Awaited<ReturnType<typeof deployMaster>>) => ({ address: d.miningReserve.address, amount: MINING_ALLOCATION }) },
      { statusField: 'treasury_issued', select: (d: Awaited<ReturnType<typeof deployMaster>>) => ({ address: d.treasury.address, amount: ONE_BILLION_ALLOCATION }) },
      { statusField: 'liquidity_issued', select: (d: Awaited<ReturnType<typeof deployMaster>>) => ({ address: d.liquidity.address, amount: ONE_BILLION_ALLOCATION }) },
      { statusField: 'ecosystem_issued', select: (d: Awaited<ReturnType<typeof deployMaster>>) => ({ address: d.ecosystem.address, amount: ONE_BILLION_ALLOCATION }) },
    ] as const;

    for (const role of roles) {
      const blockchain = await Blockchain.create();
      const owner = await blockchain.treasury('owner');
      const destinations = await deployMaster(blockchain, owner);
      const target = role.select(destinations, owner);
      const walletAddress = await destinations.master.getGetWalletAddress(target.address);

      // An active rejecting account at the deterministic Jetton wallet address
      // makes the real bounceable credit message fail and return naturally.
      const rejector = await BounceRejector.fromInit();
      if (!rejector.init) {
        throw new Error('BounceRejector StateInit was not generated');
      }
      await blockchain.setShardAccount(
        walletAddress,
        createShardAccount({
          address: walletAddress,
          code: rejector.init.code,
          data: rejector.init.data,
          balance: toNano('1'),
          workchain: 0,
        }),
      );

      const mint = await destinations.master.send(
        owner.getSender(),
        { value: toNano('0.5') },
        { $$type: 'VCoinMint', receiver: target.address, amount: target.amount },
      );
      expect(mint.transactions).toHaveTransaction({
        from: walletAddress,
        to: destinations.master.address,
        inMessageBounced: true,
        success: true,
      });
      expect((await destinations.master.getGetJettonData()).total_supply).toBe(0n);
      expect((await destinations.master.getGetJettonData()).mintable).toBe(true);
      const status = await destinations.master.getGetAllocationStatus();
      expect(status[role.statusField]).toBe(false);
    }
  });

  test('permits retry of only the allocation that was naturally bounced', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const { master } = await deployMaster(blockchain, owner);
    const walletAddress = await master.getGetWalletAddress(owner.address);

    const rejector = await BounceRejector.fromInit();
    if (!rejector.init) {
      throw new Error('BounceRejector StateInit was not generated');
    }
    await blockchain.setShardAccount(
      walletAddress,
      createShardAccount({
        address: walletAddress,
        code: rejector.init.code,
        data: rejector.init.data,
        balance: toNano('1'),
        workchain: 0,
      }),
    );
    const failed = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: FOUNDER_ALLOCATION },
    );
    expect(failed.transactions).toHaveTransaction({
      from: walletAddress,
      to: master.address,
      inMessageBounced: true,
      success: true,
    });

    const realWallet = await VCoinJettonWallet.fromInit(owner.address, master.address);
    if (!realWallet.init) {
      throw new Error('Jetton wallet StateInit was not generated');
    }
    await blockchain.setShardAccount(
      walletAddress,
      createShardAccount({
        address: walletAddress,
        code: realWallet.init.code,
        data: realWallet.init.data,
        balance: toNano('1'),
        workchain: 0,
      }),
    );

    const retried = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: FOUNDER_ALLOCATION },
    );
    expect(retried.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(FOUNDER_ALLOCATION);
    const wallet = blockchain.openContract(VCoinJettonWallet.fromAddress(walletAddress));
    expect((await wallet.getGetWalletData()).balance).toBe(FOUNDER_ALLOCATION);
  });
});
