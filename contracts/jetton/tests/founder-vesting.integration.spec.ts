import { beginCell, internal, toNano } from "@ton/core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { VCoinMaster } from "../build/VCoinMaster_VCoinMaster";
import { VCoinJettonWallet } from "../build/VCoinMaster_VCoinJettonWallet";
import { VCoinFounderVesting } from "../build/VCoinFounderVesting_VCoinFounderVesting";
import "@ton/test-utils";

const MAX_SUPPLY = 10_000_000_000_000_000n;
const FOUNDER_ALLOCATION = 2_000_000_000_000_000n;
const DAY = 86_400;
const FOUR_YEARS = 1_460 * DAY;

describe("VCOIN founder four-year daily linear vesting", () => {
  let blockchain: Blockchain;
  let owner: SandboxContract<TreasuryContract>;
  let attacker: SandboxContract<TreasuryContract>;
  let master: SandboxContract<VCoinMaster>;
  let vesting: SandboxContract<VCoinFounderVesting>;
  let founderWallet: SandboxContract<VCoinJettonWallet>;
  let vestingWallet: SandboxContract<VCoinJettonWallet>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    blockchain.now = 1_800_000_000;
    owner = await blockchain.treasury("vcoin-founder");
    attacker = await blockchain.treasury("vesting-attacker");
    master = blockchain.openContract(
      await VCoinMaster.fromInit(owner.address, beginCell().endCell()),
    );
    await owner.send({
      to: master.address,
      value: toNano("0.1"),
      init: master.init,
      body: beginCell().endCell(),
    });

    const issuance = await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        ["$" + "$" + "type"]: "VCoinMint",
        receiver: owner.address,
        amount: MAX_SUPPLY,
      } as any,
    );
    expect(issuance.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });

    vesting = blockchain.openContract(
      await VCoinFounderVesting.fromInit(owner.address, master.address, owner.address),
    );
    await owner.send({
      to: vesting.address,
      value: toNano("0.1"),
      init: vesting.init,
      body: beginCell().endCell(),
    });

    const founderWalletAddress = await master.getGetWalletAddress(owner.address);
    const vestingWalletAddress = await master.getGetWalletAddress(vesting.address);
    const configure = await vesting.send(
      owner.getSender(),
      { value: toNano("0.05") },
      {
        ["$" + "$" + "type"]: "ConfigureFounderVestingWallet",
        wallet: vestingWalletAddress,
      } as any,
    );
    expect(configure.transactions).toHaveTransaction({
      from: owner.address,
      to: vesting.address,
      success: true,
    });
    founderWallet = blockchain.openContract(VCoinJettonWallet.fromAddress(founderWalletAddress));
    vestingWallet = blockchain.openContract(VCoinJettonWallet.fromAddress(vestingWalletAddress));
  });

  async function fundVesting(): Promise<void> {
    const funding = await founderWallet.send(
      owner.getSender(),
      { value: toNano("0.3") },
      {
        ["$" + "$" + "type"]: "TokenTransfer",
        query_id: 1n,
        amount: FOUNDER_ALLOCATION,
        destination: vesting.address,
        response_destination: owner.address,
        custom_payload: null,
        forward_ton_amount: toNano("0.01"),
        forward_payload: beginCell().endCell().asSlice(),
      } as any,
    );
    expect(funding.transactions).toHaveTransaction({
      from: founderWallet.address,
      to: vestingWallet.address,
      success: true,
    });
    expect(funding.transactions).toHaveTransaction({
      from: vestingWallet.address,
      to: vesting.address,
      success: true,
    });
    expect((await vesting.getGetVestingData()).funded).toBe(true);
    expect((await vestingWallet.getGetWalletData()).balance).toBe(FOUNDER_ALLOCATION);
  }

  test("rejects any attempt to replace the configured vesting wallet", async () => {
    const originalWallet = await vesting.getGetVestingWalletAddress();
    const unauthorized = await vesting.send(
      attacker.getSender(),
      { value: toNano("0.05") },
      {
        ["$" + "$" + "type"]: "ConfigureFounderVestingWallet",
        wallet: attacker.address,
      } as any,
    );
    expect(unauthorized.transactions).toHaveTransaction({
      from: attacker.address,
      to: vesting.address,
      aborted: true,
    });

    const duplicate = await vesting.send(
      owner.getSender(),
      { value: toNano("0.05") },
      {
        ["$" + "$" + "type"]: "ConfigureFounderVestingWallet",
        wallet: attacker.address,
      } as any,
    );
    expect(duplicate.transactions).toHaveTransaction({
      from: owner.address,
      to: vesting.address,
      aborted: true,
    });
    expect(await vesting.getGetVestingWalletAddress()).toEqualAddress(originalWallet);
  });

  test("starts the clock only after the exact founder allocation is received", async () => {
    expect(await vesting.getGetVestingWalletAddress()).toEqualAddress(vestingWallet.address);
    const before = await vesting.getGetVestingData();
    expect(before.funded).toBe(false);
    expect(before.start_time).toBe(0n);

    await fundVesting();
    const after = await vesting.getGetVestingData();
    expect(after.funded).toBe(true);
    expect(after.start_time).toBe(BigInt(blockchain.now!));
    expect(after.released).toBe(0n);
  });

  test("rejects forged funding notifications from an untrusted sender", async () => {
    const result = await vesting.send(
      attacker.getSender(),
      { value: toNano("0.05") },
      {
        ["$" + "$" + "type"]: "TokenNotification",
        query_id: 2n,
        amount: FOUNDER_ALLOCATION,
        from: owner.address,
        forward_payload: beginCell().endCell().asSlice(),
      } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: attacker.address,
      to: vesting.address,
      aborted: true,
    });
    expect((await vesting.getGetVestingData()).funded).toBe(false);
  });

  test("releases exactly one quarter after 365 elapsed days", async () => {
    await fundVesting();
    blockchain.now = blockchain.now! + 365 * DAY;
    const result = await vesting.send(
      attacker.getSender(),
      { value: toNano("0.2") },
      { ["$" + "$" + "type"]: "ClaimFounderVesting", query_id: 3n } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: vesting.address,
      to: vestingWallet.address,
      success: true,
    });
    const quarter = FOUNDER_ALLOCATION / 4n;
    expect((await vesting.getGetVestingData()).released).toBe(quarter);
    expect((await vestingWallet.getGetWalletData()).balance).toBe(FOUNDER_ALLOCATION - quarter);
    const founderBalance = await founderWallet.getGetWalletData();
    expect(founderBalance.balance).toBe(MAX_SUPPLY - FOUNDER_ALLOCATION + quarter);
  });

  test("does not release anything before the first full vesting day", async () => {
    await fundVesting();
    blockchain.now = blockchain.now! + DAY - 1;
    const result = await vesting.send(
      owner.getSender(),
      { value: toNano("0.2") },
      { ["$" + "$" + "type"]: "ClaimFounderVesting", query_id: 4n } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: vesting.address,
      aborted: true,
    });
    expect((await vesting.getGetVestingData()).released).toBe(0n);
  });

  test("releases the remaining balance by the end of the four-year term", async () => {
    await fundVesting();
    blockchain.now = blockchain.now! + FOUR_YEARS;
    const result = await vesting.send(
      owner.getSender(),
      { value: toNano("0.2") },
      { ["$" + "$" + "type"]: "ClaimFounderVesting", query_id: 5n } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: vesting.address,
      to: vestingWallet.address,
      success: true,
    });
    expect((await vesting.getGetVestingData()).released).toBe(FOUNDER_ALLOCATION);
    expect((await vestingWallet.getGetWalletData()).balance).toBe(0n);
    expect((await founderWallet.getGetWalletData()).balance).toBe(MAX_SUPPLY);
  });


  test("rolls back released accounting after an authenticated downstream wallet bounce", async () => {
    await fundVesting();
    blockchain.now = blockchain.now! + 365 * DAY;
    const claim = await vesting.send(
      owner.getSender(),
      { value: toNano("0.2") },
      { ["$" + "$" + "type"]: "ClaimFounderVesting", query_id: 8n } as any,
    );
    expect(claim.transactions).toHaveTransaction({
      from: vesting.address,
      to: vestingWallet.address,
      success: true,
    });
    expect((await vesting.getGetVestingData()).released).toBe(FOUNDER_ALLOCATION / 4n);

    // Sandbox-inject the callback emitted by the configured source Jetton
    // wallet's bounced(TokenTransferInternal) handler.
    const bounceBody = beginCell()
      .storeUint(0x4557784e, 32) // crc32("JettonTransferBounce")
      .storeUint(8, 64)
      .storeCoins(FOUNDER_ALLOCATION / 4n)
      .endCell();
    const recoveredMessage = internal({
      to: vesting.address,
      value: toNano("0.05"),
      bounce: false,
      body: bounceBody,
    }) as any;
    recoveredMessage.info.src = vestingWallet.address;
    const recovered = await blockchain.sendMessage(recoveredMessage);
    expect(recovered.transactions).toHaveTransaction({
      from: vestingWallet.address,
      to: vesting.address,
      success: true,
    });
    expect((await vesting.getGetVestingData()).released).toBe(0n);
  });

  test("rejects a forged downstream bounce callback", async () => {
    await fundVesting();
    blockchain.now = blockchain.now! + 365 * DAY;
    await vesting.send(
      owner.getSender(),
      { value: toNano("0.2") },
      { ["$" + "$" + "type"]: "ClaimFounderVesting", query_id: 9n } as any,
    );
    const bounceBody = beginCell()
      .storeUint(0x4557784e, 32)
      .storeUint(9, 64)
      .storeCoins(FOUNDER_ALLOCATION / 4n)
      .endCell();
    const forgedMessage = internal({
      to: vesting.address,
      value: toNano("0.05"),
      bounce: false,
      body: bounceBody,
    }) as any;
    forgedMessage.info.src = attacker.address;
    const forged = await blockchain.sendMessage(forgedMessage);
    expect(forged.transactions).toHaveTransaction({
      from: attacker.address,
      to: vesting.address,
      aborted: true,
    });
    expect((await vesting.getGetVestingData()).released).toBe(FOUNDER_ALLOCATION / 4n);
  });

  test("does not permit a second claim for already released tokens", async () => {
    await fundVesting();
    blockchain.now = blockchain.now! + 365 * DAY;
    await vesting.send(
      owner.getSender(),
      { value: toNano("0.2") },
      { ["$" + "$" + "type"]: "ClaimFounderVesting", query_id: 6n } as any,
    );
    const second = await vesting.send(
      owner.getSender(),
      { value: toNano("0.2") },
      { ["$" + "$" + "type"]: "ClaimFounderVesting", query_id: 7n } as any,
    );
    expect(second.transactions).toHaveTransaction({
      from: owner.address,
      to: vesting.address,
      aborted: true,
    });
    expect((await vesting.getGetVestingData()).released).toBe(FOUNDER_ALLOCATION / 4n);
  });
});
