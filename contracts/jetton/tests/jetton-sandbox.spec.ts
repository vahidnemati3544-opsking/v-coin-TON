import { Blockchain, SandboxContract, TreasuryContract, createShardAccount } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import '@ton/test-utils';
import { VCoinMaster } from '../build/VCoinMaster_VCoinMaster';
import { VCoinJettonWallet } from '../build/VCoinMaster_VCoinJettonWallet';
import { BounceRejector } from '../build-test/BounceRejector_BounceRejector';

const MAX_SUPPLY = 10_000_000_000_000_000n;

async function deployMaster(
  blockchain: Blockchain,
  owner: SandboxContract<TreasuryContract>,
) {
  const master = blockchain.openContract(
    await VCoinMaster.fromInit(owner.address, Cell.EMPTY),
  );
  const deployment = await master.send(
    owner.getSender(),
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
  return master;
}

describe('VCOIN Jetton Sandbox release gates', () => {
  test('allows only the owner to issue the exact fixed supply once', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const attacker = await blockchain.treasury('attacker');
    const master = await deployMaster(blockchain, owner);

    const unauthorized = await master.send(
      attacker.getSender(),
      { value: toNano('0.1') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: MAX_SUPPLY },
    );
    expect(unauthorized.transactions).toHaveTransaction({
      to: master.address,
      success: false,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(0n);

    const issued = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: MAX_SUPPLY },
    );
    expect(issued.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });

    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(MAX_SUPPLY);
    expect(data.mintable).toBe(false);

    const walletAddress = await master.getGetWalletAddress(owner.address);
    const wallet = blockchain.openContract(VCoinJettonWallet.fromAddress(walletAddress));
    expect((await wallet.getGetWalletData()).balance).toBe(MAX_SUPPLY);

    const repeated = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: MAX_SUPPLY },
    );
    expect(repeated.transactions).toHaveTransaction({
      to: master.address,
      success: false,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
  });

  test('rejects an underfunded initial issuance before changing supply', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const master = await deployMaster(blockchain, owner);

    const underfunded = await master.send(
      owner.getSender(),
      { value: toNano('0.01') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: MAX_SUPPLY },
    );
    expect(underfunded.transactions).toHaveTransaction({
      to: master.address,
      success: false,
    });
    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(0n);
    expect(data.mintable).toBe(true);
  });

  test('rejects partial and wrong-recipient initial issuance', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const other = await blockchain.treasury('other');
    const master = await deployMaster(blockchain, owner);

    const partial = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: MAX_SUPPLY - 1n },
    );
    expect(partial.transactions).toHaveTransaction({ to: master.address, success: false });

    const wrongRecipient = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: other.address, amount: MAX_SUPPLY },
    );
    expect(wrongRecipient.transactions).toHaveTransaction({ to: master.address, success: false });
    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(0n);
    expect(data.mintable).toBe(true);
  });

  test('rolls back initial issuance after a natural wallet-credit bounce', async () => {
    const blockchain = await Blockchain.create();
    const owner = await blockchain.treasury('owner');
    const master = await deployMaster(blockchain, owner);
    const walletAddress = await master.getGetWalletAddress(owner.address);

    // Place an intentionally rejecting contract at the deterministic wallet
    // address. The Master's real bounceable wallet-credit message reaches it,
    // fails in the compute phase, and is naturally bounced back by Sandbox.
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

    const mint = await master.send(
      owner.getSender(),
      { value: toNano('0.5') },
      { $$type: 'VCoinMint', receiver: owner.address, amount: MAX_SUPPLY },
    );

    expect(mint.transactions).toHaveTransaction({
      from: walletAddress,
      to: master.address,
      inMessageBounced: true,
      success: true,
    });
    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(0n);
    expect(data.mintable).toBe(true);
  });
});
