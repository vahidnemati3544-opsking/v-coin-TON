import "@gen/VcoinJettonWallet.code"
import "errors"
import "messages"
import "sharding"
import "storage"
import "vcoin-genesis-config"
import "vcoin-jetton-utils"
import "vcoin-messages"
import "vcoin-minter-storage"

const VCOIN_GENESIS_QUERY_ID_BASE: uint64 = 0x56434f494e000000
const VCOIN_GENESIS_SLOT_COUNT = 5

contract VcoinJettonMinter {
    author: "V COIN"
    version: "1.0.0"
    description: "VCOIN fixed-supply TEP-74 Master with one-time acknowledged genesis"
    incomingMessages: VcoinAllowedMessageToMinter
    storage: VcoinMinterStorage
}

type VcoinAllowedMessageToMinter =
    | VcoinGenesisSlotRequest
    | VcoinGenesisCreditAck
    | BurnNotificationForMinter
    | RequestWalletAddress
    | TopUpTons

fun vcoinGenesisQueryId(slotId: uint8): uint64 {
    return VCOIN_GENESIS_QUERY_ID_BASE + slotId;
}

fun vcoinSlotIdFromQueryId(queryId: uint64): uint8 {
    if (queryId == vcoinGenesisQueryId(1)) {
        return 1;
    }
    if (queryId == vcoinGenesisQueryId(2)) {
        return 2;
    }
    if (queryId == vcoinGenesisQueryId(3)) {
        return 3;
    }
    if (queryId == vcoinGenesisQueryId(4)) {
        return 4;
    }
    if (queryId == vcoinGenesisQueryId(5)) {
        return 5;
    }
    throw ERROR_INVALID_MESSAGE;
}

fun vcoinLoadGenesisSlot(storage: VcoinMinterStorage, slotId: uint8): VcoinGenesisSlot {
    val core = storage.coreSlots.load();
    val extra = storage.extraSlots.load();
    match (slotId) {
        1 => {
            return core.founderSlot.load();
        }
        2 => {
            return core.miningSlot.load();
        }
        3 => {
            return core.treasurySlot.load();
        }
        4 => {
            return extra.liquiditySlot.load();
        }
        5 => {
            return extra.ecosystemSlot.load();
        }
        else => throw ERROR_INVALID_MESSAGE,
    }
}

fun vcoinStoreGenesisSlot(
    storage: VcoinMinterStorage,
    slotId: uint8,
    slot: VcoinGenesisSlot,
): VcoinMinterStorage {
    var updated = storage;
    var core = updated.coreSlots.load();
    var extra = updated.extraSlots.load();
    match (slotId) {
        1 => {
            core.founderSlot = slot.toCell();
            updated.coreSlots = core.toCell();
        }
        2 => {
            core.miningSlot = slot.toCell();
            updated.coreSlots = core.toCell();
        }
        3 => {
            core.treasurySlot = slot.toCell();
            updated.coreSlots = core.toCell();
        }
        4 => {
            extra.liquiditySlot = slot.toCell();
            updated.extraSlots = extra.toCell();
        }
        5 => {
            extra.ecosystemSlot = slot.toCell();
            updated.extraSlots = extra.toCell();
        }
        else => throw ERROR_INVALID_MESSAGE,
    }
    return updated;
}

fun vcoinCompletedAmount(slot: VcoinGenesisSlot): coins {
    if (slot.status == 2) {
        return slot.amount;
    }
    return grams("0");
}

fun vcoinCompletedCount(slot: VcoinGenesisSlot): int {
    return slot.status == 2 ? 1 : 0;
}

fun vcoinValidateGenesisConfig(storage: VcoinMinterStorage) {
    val founder = vcoinLoadGenesisSlot(storage, 1);
    val mining = vcoinLoadGenesisSlot(storage, 2);
    val treasury = vcoinLoadGenesisSlot(storage, 3);
    val liquidity = vcoinLoadGenesisSlot(storage, 4);
    val ecosystem = vcoinLoadGenesisSlot(storage, 5);

    assert (founder.amount == VCOIN_FOUNDER_ALLOCATION_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (mining.amount == VCOIN_MINING_RESERVE_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (treasury.amount == VCOIN_TREASURY_ALLOCATION_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (liquidity.amount == VCOIN_LIQUIDITY_ALLOCATION_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (ecosystem.amount == VCOIN_ECOSYSTEM_ALLOCATION_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (
        vcoinGenesisAllocationTotal() == VCOIN_TOTAL_SUPPLY_BASE_UNITS
    ) throw ERROR_INVALID_MESSAGE;

    assert (founder.status <= 2) throw ERROR_INVALID_MESSAGE;
    assert (mining.status <= 2) throw ERROR_INVALID_MESSAGE;
    assert (treasury.status <= 2) throw ERROR_INVALID_MESSAGE;
    assert (liquidity.status <= 2) throw ERROR_INVALID_MESSAGE;
    assert (ecosystem.status <= 2) throw ERROR_INVALID_MESSAGE;
    assert (
        founder.status == 0 || founder.queryId == vcoinGenesisQueryId(1)
    ) throw ERROR_INVALID_MESSAGE;
    assert (
        mining.status == 0 || mining.queryId == vcoinGenesisQueryId(2)
    ) throw ERROR_INVALID_MESSAGE;
    assert (
        treasury.status == 0 || treasury.queryId == vcoinGenesisQueryId(3)
    ) throw ERROR_INVALID_MESSAGE;
    assert (
        liquidity.status == 0 || liquidity.queryId == vcoinGenesisQueryId(4)
    ) throw ERROR_INVALID_MESSAGE;
    assert (
        ecosystem.status == 0 || ecosystem.queryId == vcoinGenesisQueryId(5)
    ) throw ERROR_INVALID_MESSAGE;

    val completedAmount: coins = vcoinCompletedAmount(founder) + vcoinCompletedAmount(mining) +
        vcoinCompletedAmount(treasury) +
        vcoinCompletedAmount(liquidity) +
        vcoinCompletedAmount(ecosystem);
    val completedCount = vcoinCompletedCount(founder) + vcoinCompletedCount(mining) +
        vcoinCompletedCount(treasury) +
        vcoinCompletedCount(liquidity) +
        vcoinCompletedCount(ecosystem);
    assert (storage.genesisIssued == completedAmount) throw ERROR_INVALID_MESSAGE;
    assert (storage.completedSlots == completedCount) throw ERROR_INVALID_MESSAGE;
    assert (storage.totalSupply <= storage.genesisIssued) throw ERROR_INVALID_MESSAGE;
    assert (storage.genesisIssued <= VCOIN_TOTAL_SUPPLY_BASE_UNITS) throw ERROR_INVALID_MESSAGE;

    assert (founder.recipient != mining.recipient) throw ERROR_INVALID_MESSAGE;
    assert (founder.recipient != treasury.recipient) throw ERROR_INVALID_MESSAGE;
    assert (founder.recipient != liquidity.recipient) throw ERROR_INVALID_MESSAGE;
    assert (founder.recipient != ecosystem.recipient) throw ERROR_INVALID_MESSAGE;
    assert (mining.recipient != treasury.recipient) throw ERROR_INVALID_MESSAGE;
    assert (mining.recipient != liquidity.recipient) throw ERROR_INVALID_MESSAGE;
    assert (mining.recipient != ecosystem.recipient) throw ERROR_INVALID_MESSAGE;
    assert (treasury.recipient != liquidity.recipient) throw ERROR_INVALID_MESSAGE;
    assert (treasury.recipient != ecosystem.recipient) throw ERROR_INVALID_MESSAGE;
    assert (liquidity.recipient != ecosystem.recipient) throw ERROR_INVALID_MESSAGE;
}

fun vcoinSendGenesisSlot(slot: VcoinGenesisSlot, slotId: uint8) {
    val walletCode = vcoinJettonWalletCompiledCode();
    val transfer = createMessage({
        bounce: BounceMode.Only256BitsOfBody,
        dest: calcDeployedVcoinJettonWallet(
            slot.recipient,
            contract.getAddress(),
            walletCode,
        ),
        value: grams("1"),
        body: InternalTransferStep {
            queryId: vcoinGenesisQueryId(slotId),
            jettonAmount: slot.amount,
            transferInitiator: null,
            sendExcessesTo: null,
            forwardTonAmount: 0,
            forwardPayload: beginCell().endCell().beginParse(),
        },
    });
    transfer.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
}

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = lazy InternalTransferStep.fromSlice(in.bouncedBody);
    var storage = lazy VcoinMinterStorage.load();
    val slotId = vcoinSlotIdFromQueryId(msg.queryId);
    var slot = vcoinLoadGenesisSlot(storage, slotId);
    if (slot.status == 1 && slot.amount == msg.jettonAmount) {
        slot.status = 0;
        storage = vcoinStoreGenesisSlot(storage, slotId, slot);
        storage.save();
    }
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy VcoinAllowedMessageToMinter.fromSlice(in.body);

    match (msg) {
        VcoinGenesisSlotRequest => {
            var storage = lazy VcoinMinterStorage.load();
            assert (in.senderAddress == storage.genesisCoordinator) throw ERROR_NOT_OWNER;
            vcoinValidateGenesisConfig(storage);
            assert (
                msg.slotId >= 1 && msg.slotId <= VCOIN_GENESIS_SLOT_COUNT
            ) throw ERROR_INVALID_MESSAGE;

            var slot = vcoinLoadGenesisSlot(storage, msg.slotId);
            if (slot.status == 2) {
                return;
            }
            assert (slot.status == 0 || slot.status == 1) throw ERROR_INVALID_MESSAGE;
            assert (slot.amount > 0) throw ERROR_INVALID_MESSAGE;

            val expectedQueryId = vcoinGenesisQueryId(msg.slotId);
            if (slot.status == 1) {
                assert (slot.queryId == expectedQueryId) throw ERROR_INVALID_MESSAGE;
            } else {
                slot.status = 1;
                slot.queryId = expectedQueryId;
                storage = vcoinStoreGenesisSlot(storage, msg.slotId, slot);
                storage.save();
            }

            vcoinSendGenesisSlot(slot, msg.slotId);
        }

        VcoinGenesisCreditAck => {
            var storage = lazy VcoinMinterStorage.load();
            vcoinValidateGenesisConfig(storage);
            val slotId = vcoinSlotIdFromQueryId(msg.queryId);
            var slot = vcoinLoadGenesisSlot(storage, slotId);
            val expectedWallet = calcAddressOfVcoinJettonWallet(
                slot.recipient,
                contract.getAddress(),
                vcoinJettonWalletCompiledCode(),
            );
            assert (in.senderAddress == expectedWallet) throw ERROR_NOT_VALID_WALLET;
            assert (msg.ownerAddress == slot.recipient) throw ERROR_INVALID_MESSAGE;
            assert (msg.jettonAmount == slot.amount) throw ERROR_INVALID_MESSAGE;

            if (slot.status == 2) {
                return;
            }
            assert (slot.status == 1) throw ERROR_INVALID_MESSAGE;
            slot.status = 2;
            storage = vcoinStoreGenesisSlot(storage, slotId, slot);
            storage.totalSupply += slot.amount;
            storage.genesisIssued += slot.amount;
            storage.completedSlots += 1;
            storage.save();
        }

        BurnNotificationForMinter => {
            var storage = lazy VcoinMinterStorage.load();
            assert (
                in.senderAddress ==
                calcAddressOfVcoinJettonWallet(
                    msg.burnInitiator,
                    contract.getAddress(),
                    vcoinJettonWalletCompiledCode(),
                )
            ) throw ERROR_NOT_VALID_WALLET;
            assert (storage.totalSupply >= msg.jettonAmount) throw ERROR_BALANCE_ERROR;
            storage.totalSupply -= msg.jettonAmount;
            storage.save();

            if (msg.sendExcessesTo == null) {
                return;
            }
            val excessesMsg = createMessage({
                bounce: BounceMode.NoBounce,
                dest: msg.sendExcessesTo,
                value: 0,
                body: ReturnExcessesBack { queryId: msg.queryId },
            });
            excessesMsg.send(
                SEND_MODE_IGNORE_ERRORS | SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE,
            );
        }

        RequestWalletAddress => {
            val ownerAddress: Cell<address>? = msg.includeOwnerAddress
                ? msg.ownerAddress.toCell()
                : null;
            var walletAddress: address? = null;
            if (msg.ownerAddress.getWorkchain() == MY_WORKCHAIN) {
                walletAddress = calcAddressOfVcoinJettonWallet(
                    msg.ownerAddress,
                    contract.getAddress(),
                    vcoinJettonWalletCompiledCode(),
                );
            }
            val respondMsg = createMessage({
                bounce: BounceMode.NoBounce,
                dest: in.senderAddress,
                value: 0,
                body: ResponseWalletAddress {
                    queryId: msg.queryId,
                    jettonWalletAddress: walletAddress,
                    ownerAddress,
                },
            });
            respondMsg.send(
                SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
            );
        }

        TopUpTons => {
            // Accept TON for Master storage and transaction fees.
        }

        else => throw ERROR_WRONG_OP,
    }
}

get fun get_jetton_data(): VcoinJettonDataReply {
    val storage = lazy VcoinMinterStorage.load();
    return {
        totalSupply: storage.totalSupply,
        mintable: storage.completedSlots < VCOIN_GENESIS_SLOT_COUNT,
        adminAddress: null,
        jettonContent: storage.metadata as Cell<OnchainMetadataReply>,
        jettonWalletCode: vcoinJettonWalletCompiledCode(),
    };
}

get fun get_wallet_address(ownerAddress: address): address {
    return calcAddressOfVcoinJettonWallet(
        ownerAddress,
        contract.getAddress(),
        vcoinJettonWalletCompiledCode(),
    );
}

get fun get_genesis_status(): VcoinGenesisStatusReply {
    val storage = lazy VcoinMinterStorage.load();
    return {
        totalSupply: storage.totalSupply,
        genesisIssued: storage.genesisIssued,
        completedSlots: storage.completedSlots,
        genesisComplete: storage.completedSlots == VCOIN_GENESIS_SLOT_COUNT,
    };
}

get fun get_genesis_slot(slotId: uint8): VcoinGenesisSlot {
    val storage = lazy VcoinMinterStorage.load();
    return vcoinLoadGenesisSlot(storage, slotId);
}

get fun get_contract_balance(): coins {
    return contract.getOriginalBalance();
}
