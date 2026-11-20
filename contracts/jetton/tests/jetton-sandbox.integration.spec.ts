import { beginCell, toNano } from "@ton/core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { VCoinMaster } from "../build/VCoinMaster_VCoinMaster";
import { VCoinJettonWallet } from "../build/VCoinMaster_VCoinJettonWallet";
import "@ton/test-utils";

const MAX_SUPPLY = 10_000_000_000_000_000n;
const ONE_TOKEN = 1_000_000n;

describe("VCOIN Jetton master and wallet — TON Sandbox integration", () => {
  let blockchain: Blockchain;
  let owner: SandboxContract<TreasuryContract>;
  let attacker: SandboxContract<TreasuryContract>;
  let recipient: SandboxContract<TreasuryContract>;
  let miningReserve: SandboxContract<TreasuryContract>;
  let treasury: SandboxContract<TreasuryContract>;
  let liquidity: SandboxContract<TreasuryContract>;
  let ecosystem: SandboxContract<TreasuryContract>;
  let master: SandboxContract<VCoinMaster>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    owner = await blockchain.treasury("vcoin-owner");
    attacker = await blockchain.treasury("unauthorized-caller");
    recipient = await blockchain.treasury("vcoin-recipient");
    miningReserve = await blockchain.treasury("vcoin-mining-reserve");
    treasury = await blockchain.treasury("vcoin-treasury");
    liquidity = await blockchain.treasury("vcoin-liquidity");
    ecosystem = await blockchain.treasury("vcoin-ecosystem");
    master = blockchain.openContract(
      await VCoinMaster.fromInit(owner.address, beginCell().endCell()),
    );

    const deployment = await owner.send({
      to: master.address,
      value: toNano("0.1"),
      init: master.init,
      body: beginCell().endCell(),
    });

    expect(deployment.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      deploy: true,
      success: true,
    });
  });

  async function issueFullSupply(): Promise<void> {
    const result = await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        $$type: "VCoinMint",
        receiver: owner.address,
        amount: MAX_SUPPLY,
      },
    );

    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });
  }

  async function walletFor(address: typeof owner.address) {
    const walletAddress = await master.getGetWalletAddress(address);
    return blockchain.openContract(VCoinJettonWallet.fromAddress(walletAddress));
  }

  test("issues the exact fixed supply once, credits the founder wallet, and disables minting", async () => {
    await issueFullSupply();

    const data = await master.getGetJettonData();
    const founderWallet = await walletFor(owner.address);
    const founderWalletData = await founderWallet.getGetWalletData();

    expect(data.total_supply).toBe(MAX_SUPPLY);
    expect(data.mintable).toBe(false);
    expect(founderWalletData.balance).toBe(MAX_SUPPLY);
    expect(founderWalletData.owner).toEqualAddress(owner.address);
    expect(founderWalletData.master).toEqualAddress(master.address);
  });

  test("rejects issuance from a non-owner and leaves supply unchanged", async () => {
    const result = await master.send(
      attacker.getSender(),
      { value: toNano("0.2") },
      {
        $$type: "VCoinMint",
        receiver: owner.address,
        amount: MAX_SUPPLY,
      },
    );

    expect(result.transactions).toHaveTransaction({
      from: attacker.address,
      to: master.address,
      aborted: true,
    });

    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(0n);
    expect(data.mintable).toBe(true);
  });

  test("rejects a non-exact issuance amount and leaves supply unchanged", async () => {
    const result = await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        $$type: "VCoinMint",
        receiver: owner.address,
        amount: MAX_SUPPLY - 1n,
      },
    );

    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      aborted: true,
    });

    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(0n);
    expect(data.mintable).toBe(true);
  });

  test("rejects issuance to any address other than the owner", async () => {
    const result = await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        $$type: "VCoinMint",
        receiver: attacker.address,
        amount: MAX_SUPPLY,
      },
    );

    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      aborted: true,
    });

    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(0n);
    expect(data.mintable).toBe(true);
  });

  test("rejects a second issuance after the fixed supply was issued", async () => {
    await issueFullSupply();

    const second = await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        $$type: "VCoinMint",
        receiver: owner.address,
        amount: MAX_SUPPLY,
      },
    );

    expect(second.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      aborted: true,
    });

    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(MAX_SUPPLY);
    expect(data.mintable).toBe(false);
  });

  test("transfers Jettons to a recipient wallet and preserves total supply", async () => {
    await issueFullSupply();
    const founderWallet = await walletFor(owner.address);
    const recipientWallet = await walletFor(recipient.address);
    const recipientWalletAddress = recipientWallet.address;

    const result = await founderWallet.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        $$type: "TokenTransfer",
        query_id: 1n,
        amount: 25n * ONE_TOKEN,
        destination: recipient.address,
        response_destination: owner.address,
        custom_payload: null,
        forward_ton_amount: 0n,
        forward_payload: beginCell().endCell().asSlice(),
      },
    );

    expect(result.transactions).toHaveTransaction({
      from: founderWallet.address,
      to: recipientWalletAddress,
      success: true,
    });

    expect((await founderWallet.getGetWalletData()).balance).toBe(MAX_SUPPLY - 25n * ONE_TOKEN);
    expect((await recipientWallet.getGetWalletData()).balance).toBe(25n * ONE_TOKEN);
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
  });

  test("distributes the approved five-wallet allocation schedule exactly", async () => {
    await issueFullSupply();
    const founderWallet = await walletFor(owner.address);
    const allocations = [
      { destination: miningReserve, amount: 5_000_000_000n * ONE_TOKEN },
      { destination: treasury, amount: 1_000_000_000n * ONE_TOKEN },
      { destination: liquidity, amount: 1_000_000_000n * ONE_TOKEN },
      { destination: ecosystem, amount: 1_000_000_000n * ONE_TOKEN },
    ];

    let queryId = 10n;
    for (const allocation of allocations) {
      const recipientWallet = await walletFor(allocation.destination.address);
      const transferMessage: any = {
        ["$" + "$" + "type"]: "TokenTransfer",
        query_id: queryId,
        amount: allocation.amount,
        destination: allocation.destination.address,
        response_destination: owner.address,
        custom_payload: null,
        forward_ton_amount: 0n,
        forward_payload: beginCell().endCell().asSlice(),
      };
      const result = await founderWallet.send(
        owner.getSender(),
        { value: toNano("0.2") },
        transferMessage,
      );
      expect(result.transactions).toHaveTransaction({
        from: founderWallet.address,
        to: recipientWallet.address,
        success: true,
      });
      queryId += 1n;
    }

    expect((await founderWallet.getGetWalletData()).balance).toBe(2_000_000_000n * ONE_TOKEN);
    expect((await (await walletFor(miningReserve.address)).getGetWalletData()).balance).toBe(5_000_000_000n * ONE_TOKEN);
    expect((await (await walletFor(treasury.address)).getGetWalletData()).balance).toBe(1_000_000_000n * ONE_TOKEN);
    expect((await (await walletFor(liquidity.address)).getGetWalletData()).balance).toBe(1_000_000_000n * ONE_TOKEN);
    expect((await (await walletFor(ecosystem.address)).getGetWalletData()).balance).toBe(1_000_000_000n * ONE_TOKEN);
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
  });

  test("rejects a Jetton transfer signed by a non-owner", async () => {
    await issueFullSupply();
    const founderWallet = await walletFor(owner.address);

    const result = await founderWallet.send(
      attacker.getSender(),
      { value: toNano("0.2") },
      {
        $$type: "TokenTransfer",
        query_id: 2n,
        amount: ONE_TOKEN,
        destination: recipient.address,
        response_destination: attacker.address,
        custom_payload: null,
        forward_ton_amount: 0n,
        forward_payload: beginCell().endCell().asSlice(),
      },
    );

    expect(result.transactions).toHaveTransaction({
      from: attacker.address,
      to: founderWallet.address,
      aborted: true,
    });
    expect((await founderWallet.getGetWalletData()).balance).toBe(MAX_SUPPLY);
  });

  test("burns Jettons and updates wallet balance and master supply consistently", async () => {
    await issueFullSupply();
    const founderWallet = await walletFor(owner.address);
    const burnAmount = 7n * ONE_TOKEN;

    const result = await founderWallet.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        $$type: "TokenBurn",
        query_id: 3n,
        amount: burnAmount,
        response_destination: owner.address,
        custom_payload: null,
      },
    );

    expect(result.transactions).toHaveTransaction({
      from: founderWallet.address,
      to: master.address,
      success: true,
    });
    expect((await founderWallet.getGetWalletData()).balance).toBe(MAX_SUPPLY - burnAmount);
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY - burnAmount);
  });
});
