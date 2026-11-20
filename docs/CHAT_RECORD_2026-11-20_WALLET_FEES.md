# V COIN – TON | Conversation Record: Operational TON Fee Wallet

**Record ID:** VCT-CHAT-2026-11-20-FEES  
**Date:** 2026-11-20  
**Repository:** `vahidnemati3544-opsking/v-coin-TON`  
**Branch:** `main`  
**Scope:** This record captures the decisions and instructions from the conversation on selecting and documenting the TON network-fee wallet. It applies only to V COIN – TON and does not authorize changes to the legacy BNB project.

## 1. Conversation transcript (Persian)

**User:** «برای کارمزد شبکه تون به کدام کیف پول واریز کنم»

**Assistant:** پیشنهاد شد TON برای کارمزدها در یک کیف عملیاتی مستقل نگهداری شود، نه اینکه هر پنج کیف تخصیص V COIN شارژ شوند. توضیح داده شد که کیف‌های سرد و دریافت‌کننده صرفاً به دلیل دریافت VCOIN نیازمند موجودی TON نیستند.

**User:** «کدام کیف پول»

**Assistant:** کیف Tonkeeper جداگانه‌ای که پیش‌تر آدرس آن ارائه شده بود معرفی شد، نه یکی از پنج کیف تخصیص VCOIN:
`UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB`
و پیشنهاد شد این کیف با عنوان `GAS & OPERATIONS` ثبت شود.

**User:** «بله موافقم این موضوع را در اسناد پروژه و در هاپ گیت هم ثبت کن و اینکه من فقط تون برای کارمزد شبکه با این کیف پول واریز میکنم»

**Assistant:** موافقت کاربر ثبت شد و تغییرات در اسناد پروژه و فایل پیکربندی GitHub اعمال شد. چهار فایل پس از Commit دوباره دریافت و بررسی شدند؛ آدرس کیف کارمزد در هر چهار فایل وجود داشت و فایل JSON معتبر بود.

**User:** «تمام این چت را در اسناد پروژه ذخیره کن»

## 2. Owner-approved decision

The project owner explicitly approved the separate Tonkeeper address below as the designated **V COIN – TON GAS & OPERATIONS** wallet:

`UQCOZYJNI3HC6PN1YCy1cP-ikKPygoVUQlX2SIcJ_zEWJeGB`

**Binding funding instruction:** The owner will deposit TON intended for TON network fees and authorized operational transaction costs into this wallet only.

This address:
- is a separate operational fee-funding wallet;
- is not one of the five VCOIN allocation wallets;
- is not a sixth VCOIN allocation destination;
- must not receive any portion of the 10,000,000,000 VCOIN token allocation by virtue of this designation.

The five VCOIN allocation addresses and percentages remain unchanged. Do not ask the owner to routinely fund all five allocation wallets with TON.

## 3. Technical qualification

TON fees are paid by the account that submits/signs the relevant on-chain transaction unless a specifically supported sponsored-transaction arrangement is implemented. A separate fee wallet does not automatically pay fees for every other wallet's transaction.

If a Jetton transfer, contract deployment, or contract call technically requires TON in another signing wallet:
1. identify the exact operation and signing wallet;
2. verify the required amount and network;
3. document why the designated fee wallet cannot directly cover that operation through the implemented flow;
4. obtain the owner's explicit approval before moving TON to another wallet.

Do not silently redirect deposits or assume universal fee sponsorship. Never request or store seed phrases or private keys.

## 4. Five allocation wallets — unchanged

| Allocation | Share | VCOIN | Owner-designated address |
|---|---:|---:|---|
| Founder | 20% | 2,000,000,000 | `UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy` |
| Treasury | 10% | 1,000,000,000 | `UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ` |
| Liquidity and market | 10% | 1,000,000,000 | `UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn` |
| Ecosystem and marketing | 10% | 1,000,000,000 | `UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE` |
| Mining reserve and extraction | 50% | 5,000,000,000 | `UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0` |

**Total:** 10,000,000,000 VCOIN; six decimals; no additional minting in the approved design.

## 5. GitHub changes made in this conversation

The following files were updated and committed to `main`:

1. `docs/WALLET_ALLOCATION_REGISTER.md` — version 1.1; records the separate fee wallet and the owner's TON-only fee-funding instruction.
   - Commit: `098e1c6c201a15552a89ef31abebe908eb7c4553`
   - https://github.com/vahidnemati3544-opsking/v-coin-TON/blob/main/docs/WALLET_ALLOCATION_REGISTER.md

2. `docs/FOUNDER_CONTROL_AND_ALLOCATION.md` — separates the founder allocation destination from the operational fee wallet and records the funding rule.
   - Commit: `ce2fd79a7beadf63dd727c0c157eb042c27d7824`
   - https://github.com/vahidnemati3544-opsking/v-coin-TON/blob/main/docs/FOUNDER_CONTROL_AND_ALLOCATION.md

3. `docs/TON_ARCHITECTURE.md` — adds the operational fee wallet policy and technical qualification about transaction signers and gas.
   - Commit: `fb4ced9b846c98d3234a2d9af9ca12cee6eba6b0`
   - https://github.com/vahidnemati3544-opsking/v-coin-TON/blob/main/docs/TON_ARCHITECTURE.md

4. `contracts/jetton/deployment.config.template.json` — adds an `operational_fee_wallet` object, explicitly separate from the five allocation wallets.
   - Commit: `a22d7a7f241420dc5927263388c159802ea5c4e3`
   - https://github.com/vahidnemati3544-opsking/v-coin-TON/blob/main/contracts/jetton/deployment.config.template.json

After writing, all four files were fetched again from GitHub. The fee-wallet address was confirmed present in each; the JSON configuration parsed successfully; five allocation wallet entries remained; `deployment_authorized` and `mainnet_authorized` remained false.

## 6. Status and remaining safeguards

**Completed and committed:** The owner-approved wallet designation and TON-only fee deposit instruction are documented in the four project files above.

**Not performed / not established:**
- No TON deposit or transfer was made in this conversation.
- Wallet control and network representation have not been independently verified.
- No Jetton master deployment or Mainnet deployment was authorized by these changes.
- No claim is made that the fee wallet can sponsor transactions signed by other wallets without an implemented and tested mechanism.

**Next action before funding:** Open Tonkeeper, verify the exact address shown for the selected account, confirm the intended network, and only then consider a TON deposit. Never share recovery phrases or private keys.

## 7. Change-control rule

This record is a durable audit note. Any future change to the designated fee wallet or the owner's deposit-only instruction requires explicit owner approval and synchronized updates to the wallet register, architecture, governance documentation and deployment configuration.

---
**Record status:** Conversation decision archived; GitHub commit for this archive is recorded by the repository history.
