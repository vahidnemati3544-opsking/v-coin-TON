import "@gen/VcoinJettonWallet.code"
import "errors"
import "fees-management"
import "jetton-utils"
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
    match (slotId) {
        1 => {
            return storage.founderSlot;
        }
        2 => {
            return storage.miningSlot;
        }
        3 => {
            return storage.treasurySlot;
        }
        4 => {
            return storage.liquiditySlot;
        }
        5 => {
            return storage.ecosystemSlot;
        }
        else => throw ERROR_INVALID_MESSAGE,
    }
}

fun vcoinStoreGenesisSlot(storage: VcoinMinterStorage, slotId: uint8, slot: VcoinGenesisSlot) {
    match (slotId) {
        1 => {
            storage.founderSlot = slot;
        }
        2 => {
            storage.miningSlot = slot;
        }
        3 => {
            storage.treasurySlot = slot;
        }
        4 => {
            storage.liquiditySlot = slot;
        }
        5 => {
            storage.ecosystemSlot = slot;
        }
        else => throw ERROR_INVALID_MESSAGE,
    }
}

fun vcoinValidateGenesisConfig(storage: VcoinMinterStorage) {
    assert (storage.founderSlot.amount == VCOIN_FOUNDER_ALLOCATION_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (storage.miningSlot.amount == VCOIN_MINING_RESERVE_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (storage.treasurySlot.amount == VCOIN_TREASURY_ALLOCATION_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (storage.liquiditySlot.amount == VCOIN_LIQUIDITY_ALLOCATION_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (storage.ecosystemSlot.amount == VCOIN_ECOSYSTEM_ALLOCATION_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (vcoinGenesisAllocationTotal() == VCOIN_TOTAL_SUPPLY_BASE_UNITS) throw ERROR_INVALID_MESSAGE;
    assert (storage.founderSlot.recipient != storage.miningSlot.recipient) throw ERROR_INVALID_MESSAGE;
    assert (storage.founderSlot.recipient != storage.treasurySlot.recipient) throw ERROR_INVALID_MESSAGE;
    assert (storage.founderSlot.recipient != storage.liquiditySlot.recipient) throw ERROR_INVALID_MESSAGE;
    assert (storage.founderSlot.recipient != storage.ecosystemSlot.recipient) throw ERROR_INVALID_MESSAGE;
    assert (storage.miningSlot.recipient != storage.treasurySlot.recipient) throw ERROR_INVALID_MESSAGE;
    assert (storage.miningSlot.recipient != storage.liquiditySlot.recipient) throw ERROR_INVALID_MESSAGE;
    assert (storage.miningSlot.recipient != storage.ecosystemSlot.recipient) throw ERROR_INVALID_MESSAGE;
    assert (storage.treasurySlot.recipient != storage.liquiditySlot.recipient) throw ERROR_INVALID_MESSAGE;
    assert (storage.treasurySlot.recipient != storage.ecosystemSlot.recipient) throw ERROR_INVALID_MESSAGE;
    assert (storage.liquiditySlot.recipient != storage.ecosystemSlot.recipient) throw ERROR_INVALID_MESSAGE;
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
        value: 0,
        body: InternalTransferStep {
            queryId: vcoinGenesisQueryId(slotId),
            jettonAmount: slot.amount,
            transferInitiator: null,
            sendExcessesTo: null,
            forwardTonAmount: 0,
            forwardPayload: beginCell().endCell().beginParse(),
        },
    });
    transfer.send(
        SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
    );
}

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = lazy InternalTransferStep.fromSlice(in.bouncedBody);
    var storage = lazy VcoinMinterStorage.load();
    val slotId = vcoinSlotIdFromQueryId(msg.queryId);
    var slot = vcoinLoadGenesisSlot(storage, slotId);
    if (slot.status == 1 && slot.amount == msg.jettonAmount) {
        slot.status = 0;
        vcoinStoreGenesisSlot(storage, slotId, slot);
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
            assert (msg.slotId >= 1 && msg.slotId <= VCOIN_GENESIS_SLOT_COUNT) throw ERROR_INVALID_MESSAGE;

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
                vcoinStoreGenesisSlot(storage, msg.slotId, slot);
                storage.save();
            }

            reserveGramsOnBalance(grams("0.01"), RESERVE_MODE_EXACT_AMOUNT);
            vcoinSendGenesisSlot(slot, msg.slotId);
        }

        VcoinGenesisCreditAck => {
            var storage = lazy VcoinMinterStorage.load();
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
            vcoinStoreGenesisSlot(storage, slotId, slot);
            storage.totalSupply += slot.amount;
            storage.completedSlots += 1;
            storage.save();
        }

        BurnNotificationForMinter => {
            var storage = lazy VcoinMinterStorage.load();
            assert (
                in.senderAddress == calcAddressOfVcoinJettonWallet(
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
        completedSlots: storage.completedSlots,
        genesisComplete: storage.completedSlots == VCOIN_GENESIS_SLOT_COUNT,
    };
}

get fun get_genesis_slot(slotId: uint8): VcoinGenesisSlot {
    val storage = lazy VcoinMinterStorage.load();
    return vcoinLoadGenesisSlot(storage, slotId);
}
