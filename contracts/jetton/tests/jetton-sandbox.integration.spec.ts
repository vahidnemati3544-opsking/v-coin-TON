import { Address, beginCell, internal, toNano } from "@ton/core";
import { Blockchain, SandboxContract, TreasuryContract, createShardAccount } from "@ton/sandbox";
import { VCoinMaster } from "../build/VCoinMaster_VCoinMaster";
import { VCoinJettonWallet } from "../build/VCoinMaster_VCoinJettonWallet";
import "@ton/test-utils";

const MAX_SUPPLY = 10_000_000_000_000_000n;
const FOUNDER_CAP = 2_000_000_000_000_000n;
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

  async function configureAllocations(): Promise<void> {
    const configured = await master.send(
      owner.getSender(),
      { value: toNano("0.1") },
      {
        ["$" + "$" + "type"]: "VCoinConfigureAllocations",
        founder: owner.address,
        mining: miningReserve.address,
        treasury: treasury.address,
        liquidity: liquidity.address,
        ecosystem: ecosystem.address,
      } as any,
    );
    expect(configured.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });
  }

  async function issueCategory(category: number): Promise<void> {
    const result = await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        ["$" + "$" + "type"]: "VCoinMintAllocation",
        category,
      } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });
  }

  async function issueFullSupply(): Promise<void> {
    await configureAllocations();
    for (const category of [1, 2, 3, 4, 5]) {
      await issueCategory(category);
    }
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
    expect(founderWalletData.balance).toBe(FOUNDER_CAP);
    expect(founderWalletData.owner).toEqualAddress(owner.address);
    expect(founderWalletData.master).toEqualAddress(master.address);
  });

  test("rejects issuance from a non-owner and leaves supply unchanged", async () => {
    const result = await master.send(
      attacker.getSender(),
      { value: toNano("0.2") },
      {
        ["$" + "$" + "type"]: "VCoinMintAllocation",
        category: 1,
      } as any,
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
        ["$" + "$" + "type"]: "VCoinMintAllocation",
        category: 6,
      } as any,
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

  test("locks the five allocation destinations after one-time configuration", async () => {
    await configureAllocations();
    const result = await master.send(
      owner.getSender(),
      { value: toNano("0.1") },
      {
        ["$" + "$" + "type"]: "VCoinConfigureAllocations",
        founder: attacker.address,
        mining: miningReserve.address,
        treasury: treasury.address,
        liquidity: liquidity.address,
        ecosystem: ecosystem.address,
      } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      aborted: true,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(0n);
  });

  test("rejects a second issuance after the fixed supply was issued", async () => {
    await issueFullSupply();

    const second = await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        ["$" + "$" + "type"]: "VCoinMintAllocation",
        category: 1,
      } as any,
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
        ["$" + "$" + "type"]: "TokenTransfer",
        query_id: 1n,
        amount: 25n * ONE_TOKEN,
        destination: recipient.address,
        response_destination: owner.address,
        custom_payload: null,
        forward_ton_amount: 0n,
        forward_payload: beginCell().endCell().asSlice(),
      } as any,
    );

    expect(result.transactions).toHaveTransaction({
      from: founderWallet.address,
      to: recipientWalletAddress,
      success: true,
    });

    expect((await founderWallet.getGetWalletData()).balance).toBe(FOUNDER_CAP - 25n * ONE_TOKEN);
    expect((await recipientWallet.getGetWalletData()).balance).toBe(25n * ONE_TOKEN);
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
  });

  test("issues the approved five-wallet allocation schedule exactly on-chain", async () => {
    await issueFullSupply();
    expect((await (await walletFor(owner.address)).getGetWalletData()).balance).toBe(2_000_000_000n * ONE_TOKEN);
    expect((await (await walletFor(miningReserve.address)).getGetWalletData()).balance).toBe(5_000_000_000n * ONE_TOKEN);
    expect((await (await walletFor(treasury.address)).getGetWalletData()).balance).toBe(1_000_000_000n * ONE_TOKEN);
    expect((await (await walletFor(liquidity.address)).getGetWalletData()).balance).toBe(1_000_000_000n * ONE_TOKEN);
    expect((await (await walletFor(ecosystem.address)).getGetWalletData()).balance).toBe(1_000_000_000n * ONE_TOKEN);
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
    expect((await master.getGetJettonData()).mintable).toBe(false);
  });

  test.each([
    { category: 1, label: "Founder", cap: 2_000_000_000_000_000n },
    { category: 2, label: "Mining reserve", cap: 5_000_000_000_000_000n },
    { category: 3, label: "Treasury", cap: 1_000_000_000_000_000n },
    { category: 4, label: "Liquidity / market", cap: 1_000_000_000_000_000n },
    { category: 5, label: "Ecosystem / marketing", cap: 1_000_000_000_000_000n },
  ])("rolls back a bounced $label issuance and retries only that category", async ({ category, cap }) => {
    await configureAllocations();

    const destinations = [
      owner.address,
      miningReserve.address,
      treasury.address,
      liquidity.address,
      ecosystem.address,
    ];
    const destination = destinations[category - 1];
    const walletAddress = await master.getGetWalletAddress(destination);
    const wallet = await VCoinJettonWallet.fromInit(destination, master.address);

    // Invalid storage forces the destination Jetton wallet to fail in TVM,
    // generating a protocol bounce back to the master.
    await blockchain.setShardAccount(
      walletAddress,
      createShardAccount({
        address: walletAddress,
        code: wallet.init!.code,
        data: beginCell().endCell(),
        balance: toNano("1"),
      }),
    );

    const failedIssue = await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      { ["$" + "$" + "type"]: "VCoinMintAllocation", category } as any,
    );
    expect(failedIssue.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });
    expect(failedIssue.transactions).toHaveTransaction({
      from: master.address,
      to: walletAddress,
      inMessageBounceable: true,
      aborted: true,
    });
    expect(failedIssue.transactions).toHaveTransaction({
      from: walletAddress,
      to: master.address,
      inMessageBounced: true,
      success: true,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(0n);
    expect((await master.getGetJettonData()).mintable).toBe(true);

    // Restore the deterministic wallet StateInit. A retry must credit exactly
    // this category's cap without reopening or altering any other category.
    await blockchain.setShardAccount(
      walletAddress,
      createShardAccount({
        address: walletAddress,
        code: wallet.init!.code,
        data: wallet.init!.data,
        balance: toNano("1"),
      }),
    );
    const restoredWallet = blockchain.openContract(
      VCoinJettonWallet.fromAddress(walletAddress),
    );
    expect((await restoredWallet.getGetWalletData()).balance).toBe(0n);

    const retry = await master.send(
      owner.getSender(),
      { value: toNano("0.2") },
      { ["$" + "$" + "type"]: "VCoinMintAllocation", category } as any,
    );
    expect(retry.transactions).toHaveTransaction({
      from: owner.address,
      to: master.address,
      success: true,
    });
    expect(retry.transactions).toHaveTransaction({
      from: master.address,
      to: walletAddress,
      success: true,
    });
    expect((await restoredWallet.getGetWalletData()).balance).toBe(cap);
    expect((await master.getGetJettonData()).total_supply).toBe(cap);
    expect((await master.getGetJettonData()).mintable).toBe(true);
  });
  test("implements TEP-89 include_address as an optional referenced owner address", async () => {
    for (const includeAddress of [false, true]) {
      const queryId = includeAddress ? 22n : 21n;
      const request: any = {
        ["$" + "$" + "type"]: "ProvideWalletAddress",
        query_id: queryId,
        owner_address: recipient.address,
        include_address: includeAddress,
      };
      const result = await master.send(
        owner.getSender(),
        { value: toNano("0.1") },
        request,
      );

      const responseTransaction: any = result.transactions.find((tx: any) => {
        const info = tx.inMessage?.info;
        return info?.type === "internal"
          && info.src.equals(master.address)
          && info.dest.equals(owner.address);
      });
      expect(responseTransaction).toBeDefined();

      const body = responseTransaction.inMessage.body.beginParse();
      expect(body.loadUint(32)).toBe(0xd1735400);
      body.loadUintBig(64);
      expect(body.loadAddress()).toEqualAddress(
        await master.getGetWalletAddress(recipient.address),
      );
      expect(body.loadBit()).toBe(includeAddress);
      if (includeAddress) {
        const includedOwner = body.loadRef().beginParse().loadAddress();
        expect(includedOwner).toEqualAddress(recipient.address);
      }
    }
  });

  test("rejects a Jetton transfer signed by a non-owner", async () => {
    await issueFullSupply();
    const founderWallet = await walletFor(owner.address);

    const result = await founderWallet.send(
      attacker.getSender(),
      { value: toNano("0.2") },
      {
        ["$" + "$" + "type"]: "TokenTransfer",
        query_id: 2n,
        amount: ONE_TOKEN,
        destination: recipient.address,
        response_destination: attacker.address,
        custom_payload: null,
        forward_ton_amount: 0n,
        forward_payload: beginCell().endCell().asSlice(),
      } as any,
    );

    expect(result.transactions).toHaveTransaction({
      from: attacker.address,
      to: founderWallet.address,
      aborted: true,
    });
    expect((await founderWallet.getGetWalletData()).balance).toBe(FOUNDER_CAP);
  });


  test("rejects transfer attempts exceeding the sender wallet balance", async () => {
    await issueFullSupply();
    const founderWallet = await walletFor(owner.address);
    const result = await founderWallet.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        ["$" + "$" + "type"]: "TokenTransfer",
        query_id: 40n,
        amount: MAX_SUPPLY + 1n,
        destination: recipient.address,
        response_destination: owner.address,
        custom_payload: null,
        forward_ton_amount: 0n,
        forward_payload: beginCell().endCell().asSlice(),
      } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: founderWallet.address,
      aborted: true,
    });
    expect((await founderWallet.getGetWalletData()).balance).toBe(FOUNDER_CAP);
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
  });

  test("rejects a transfer with insufficient TON for wallet execution", async () => {
    await issueFullSupply();
    const founderWallet = await walletFor(owner.address);
    const result = await founderWallet.send(
      owner.getSender(),
      { value: toNano("0.02") },
      {
        ["$" + "$" + "type"]: "TokenTransfer",
        query_id: 41n,
        amount: ONE_TOKEN,
        destination: recipient.address,
        response_destination: owner.address,
        custom_payload: null,
        forward_ton_amount: 0n,
        forward_payload: beginCell().endCell().asSlice(),
      } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: founderWallet.address,
      aborted: true,
    });
    expect((await founderWallet.getGetWalletData()).balance).toBe(FOUNDER_CAP);
  });

  test("rejects forged internal transfers from an untrusted wallet address", async () => {
    await issueFullSupply();
    const founderWallet = await walletFor(owner.address);
    const recipientWallet = await walletFor(recipient.address);
    const initialTransfer = await founderWallet.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        ["$" + "$" + "type"]: "TokenTransfer",
        query_id: 44n,
        amount: ONE_TOKEN,
        destination: recipient.address,
        response_destination: owner.address,
        custom_payload: null,
        forward_ton_amount: 0n,
        forward_payload: beginCell().endCell().asSlice(),
      } as any,
    );
    expect(initialTransfer.transactions).toHaveTransaction({
      from: founderWallet.address,
      to: recipientWallet.address,
      deploy: true,
      success: true,
    });
    const result = await recipientWallet.send(
      attacker.getSender(),
      { value: toNano("0.1") },
      {
        ["$" + "$" + "type"]: "TokenTransferInternal",
        query_id: 42n,
        amount: ONE_TOKEN,
        from: owner.address,
        response_destination: attacker.address,
        forward_ton_amount: 0n,
        forward_payload: beginCell().endCell().asSlice(),
      } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: attacker.address,
      to: recipientWallet.address,
      aborted: true,
    });
    expect((await recipientWallet.getGetWalletData()).balance).toBe(ONE_TOKEN);
  });

  test("rejects forged burn notifications that do not come from the derived Jetton wallet", async () => {
    await issueFullSupply();
    const result = await master.send(
      attacker.getSender(),
      { value: toNano("0.1") },
      {
        ["$" + "$" + "type"]: "TokenBurnNotification",
        query_id: 43n,
        amount: ONE_TOKEN,
        sender: owner.address,
        response_destination: attacker.address,
      } as any,
    );
    expect(result.transactions).toHaveTransaction({
      from: attacker.address,
      to: master.address,
      aborted: true,
    });
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY);
  });

  test("restores wallet balance when its burn notification reaches an inactive master address", async () => {
    const fakeMaster = Address.parse("0:" + "0".repeat(63) + "1");
    const isolatedWallet = blockchain.openContract(
      await VCoinJettonWallet.fromInit(owner.address, fakeMaster),
    );
    const burnAmount = 7n * ONE_TOKEN;
    const fundingBody = beginCell()
      .storeUint(0x178d4519, 32) // TokenTransferInternal
      .storeUint(76, 64)
      .storeCoins(burnAmount)
      .storeAddress(fakeMaster)
      .storeAddress(owner.address)
      .storeCoins(0)
      .storeSlice(beginCell().endCell().asSlice())
      .endCell();
    const fundingMessage = internal({
      to: isolatedWallet.address,
      value: toNano("0.1"),
      bounce: true,
      init: isolatedWallet.init,
      body: fundingBody,
    }) as any;
    fundingMessage.info.src = fakeMaster;
    const funding = await blockchain.sendMessage(fundingMessage);
    expect(funding.transactions).toHaveTransaction({
      from: fakeMaster,
      to: isolatedWallet.address,
      deploy: true,
      success: true,
    });
    const initialBalance = (await isolatedWallet.getGetWalletData()).balance;
    expect(initialBalance).toBe(burnAmount);

    // The wallet sends its burn notification to an intentionally inactive
    // master address. TON bounces that real outbound message back to the wallet.
    const burn = await isolatedWallet.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        ["$" + "$" + "type"]: "TokenBurn",
        query_id: 77n,
        amount: burnAmount,
        response_destination: owner.address,
        custom_payload: null,
      } as any,
    );
    expect(burn.transactions).toHaveTransaction({
      from: fakeMaster,
      to: isolatedWallet.address,
      success: true,
      inMessageBounced: true,
    });
    expect((await isolatedWallet.getGetWalletData()).balance).toBe(initialBalance);
  });

  test("burns Jettons and updates wallet balance and master supply consistently", async () => {
    await issueFullSupply();
    const founderWallet = await walletFor(owner.address);
    const burnAmount = 7n * ONE_TOKEN;

    const result = await founderWallet.send(
      owner.getSender(),
      { value: toNano("0.2") },
      {
        ["$" + "$" + "type"]: "TokenBurn",
        query_id: 3n,
        amount: burnAmount,
        response_destination: owner.address,
        custom_payload: null,
      } as any,
    );

    expect(result.transactions).toHaveTransaction({
      from: founderWallet.address,
      to: master.address,
      success: true,
    });
    expect((await founderWallet.getGetWalletData()).balance).toBe(FOUNDER_CAP - burnAmount);
    expect((await master.getGetJettonData()).total_supply).toBe(MAX_SUPPLY - burnAmount);
  });
});
