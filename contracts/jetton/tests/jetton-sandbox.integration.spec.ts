import { beginCell, toNano } from "@ton/core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { VCoinMaster } from "../build/VCoinMaster_VCoinMaster";
import "@ton/test-utils";

const MAX_SUPPLY = 10_000_000_000_000_000n;

describe("VCOIN Jetton master — TON Sandbox integration", () => {
  let blockchain: Blockchain;
  let owner: SandboxContract<TreasuryContract>;
  let attacker: SandboxContract<TreasuryContract>;
  let master: SandboxContract<VCoinMaster>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    owner = await blockchain.treasury("vcoin-owner");
    attacker = await blockchain.treasury("unauthorized-caller");
    master = blockchain.openContract(
      await VCoinMaster.fromInit(owner.address, beginCell().endCell()),
    );

    const deployment = await master.sendDeploy(
      owner.getSender(),
      toNano("0.1"),
    );

    expect(deployment.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      deploy: true,
      success: true,
    });
  });

  test("issues the exact fixed supply once and disables minting", async () => {
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

    const data = await master.getGetJettonData();
    expect(data.total_supply).toBe(MAX_SUPPLY);
    expect(data.mintable).toBe(false);
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
    await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        $$type: "VCoinMint",
        receiver: owner.address,
        amount: MAX_SUPPLY,
      },
    );

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
});
