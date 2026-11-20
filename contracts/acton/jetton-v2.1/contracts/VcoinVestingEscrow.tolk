import "@gen/VcoinJettonWallet.code"
import "errors"
import "jetton-utils"
import "messages"
import "vcoin-storage"
import "vcoin-messages"

const VCOIN_FOUNDER_BENEFICIARY = address("UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy")
const VCOIN_MINING_BENEFICIARY = address("UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0")
const VCOIN_RELEASE_CONTROLLER = address("UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy")

const VCOIN_VESTING_FOUNDER = 1
const VCOIN_VESTING_MINING = 2
const VCOIN_FOUNDER_AMOUNT = 2000000000000000
const VCOIN_MINING_AMOUNT = 5000000000000000
const VCOIN_FOUNDER_DURATION = 126230400
const VCOIN_MINING_DURATION = 63072000

struct (0x5643524c) ReleaseVestedVcoin {
    queryId: uint64
}

type AllowedVestingEscrowMessage = TransferNotificationForRecipient | ReleaseVestedVcoin | ReturnExcessesBack | VcoinTransferFailed | TopUpTons

contract VcoinVestingEscrow {
    author: "V COIN"
    version: "1.0.0"
    description: "Time-locked VCOIN linear vesting escrow"
    incomingMessages: AllowedVestingEscrowMessage
    storage: VcoinVestingEscrowStorage
}

fun validateVcoinVestingConfig(storage: VcoinVestingEscrowStorage) {
    assert (storage.startTime > 0) throw ERROR_INVALID_OP;
    assert (storage.controllerAddress == VCOIN_RELEASE_CONTROLLER) throw ERROR_INVALID_OP;
    assert (storage.releasedAmount <= storage.allocationAmount) throw ERROR_INVALID_OP;

    if (storage.vestingKind == VCOIN_VESTING_FOUNDER) {
        assert (storage.beneficiaryAddress == VCOIN_FOUNDER_BENEFICIARY) throw ERROR_INVALID_OP;
        assert (storage.allocationAmount == VCOIN_FOUNDER_AMOUNT) throw ERROR_INVALID_OP;
        assert (storage.duration == VCOIN_FOUNDER_DURATION) throw ERROR_INVALID_OP;
    } else if (storage.vestingKind == VCOIN_VESTING_MINING) {
        assert (storage.beneficiaryAddress == VCOIN_MINING_BENEFICIARY) throw ERROR_INVALID_OP;
        assert (storage.allocationAmount == VCOIN_MINING_AMOUNT) throw ERROR_INVALID_OP;
        assert (storage.duration == VCOIN_MINING_DURATION) throw ERROR_INVALID_OP;
    } else {
        throw ERROR_INVALID_OP;
    }
}

fun vcoinVestedAmount(storage: VcoinVestingEscrowStorage, timestamp: int): coins {
    if (timestamp <= storage.startTime) {
        return 0;
    }
    val elapsed = min(timestamp - storage.startTime, storage.duration);
    if (elapsed == storage.duration) {
        return storage.allocationAmount;
    }
    return (storage.allocationAmount * elapsed) / storage.duration;
}

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = lazy AskToTransfer.fromSlice(in.bouncedBody);
    var storage = lazy VcoinVestingEscrowStorage.fromCell(contract.getData());
    val expectedWallet = calcAddressOfJettonWallet(
        contract.getAddress(),
        storage.minterAddress,
        vcoinJettonWalletCompiledCode(),
    );
    if (in.senderAddress != expectedWallet) {
        return;
    }
    if (
        storage.pendingReleaseQueryId != msg.queryId ||
        storage.pendingReleaseAmount != msg.jettonAmount
    ) {
        return;
    }
    storage.pendingReleaseAmount = 0;
    storage.pendingReleaseQueryId = 0;
    storage.save();
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedVestingEscrowMessage.fromSlice(in.body);

    match (msg) {
        TransferNotificationForRecipient => {
            var storage = lazy VcoinVestingEscrowStorage.fromCell(contract.getData());
            validateVcoinVestingConfig(storage);
            assert (!storage.deposited) throw ERROR_INVALID_OP;
            assert (msg.transferInitiator == null) throw ERROR_INVALID_OP;
            assert (msg.jettonAmount == storage.allocationAmount) throw ERROR_INVALID_OP;
            val expectedJettonWallet = calcAddressOfJettonWallet(
                contract.getAddress(),
                storage.minterAddress,
                vcoinJettonWalletCompiledCode(),
            );
            assert (in.senderAddress == expectedJettonWallet) throw ERROR_NOT_VALID_WALLET;
            storage.deposited = true;
            storage.save();
            val depositAck = createMessage({
                bounce: BounceMode.NoBounce,
                dest: storage.minterAddress,
                value: 0,
                body: VcoinEscrowDepositAccepted {
                    queryId: msg.queryId,
                    vestingKind: storage.vestingKind,
                    jettonAmount: msg.jettonAmount,
                    escrowAddress: contract.getAddress(),
                },
            });
            depositAck.send(
                SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
            );
        }

        ReleaseVestedVcoin => {
            var storage = lazy VcoinVestingEscrowStorage.fromCell(contract.getData());
            validateVcoinVestingConfig(storage);
            assert (in.senderAddress == storage.controllerAddress) throw ERROR_NOT_OWNER;
            assert (storage.deposited) throw ERROR_INVALID_OP;
            assert (storage.pendingReleaseAmount == 0) throw ERROR_INVALID_OP;
            assert (msg.queryId != 0) throw ERROR_INVALID_OP;

            val vested = vcoinVestedAmount(storage, blockchain.now());
            assert (vested > storage.releasedAmount) throw ERROR_INVALID_OP;
            val releasable = vested - storage.releasedAmount;

            // Effects are recorded before sending. The Jetton wallet is derived
            // from this escrow owner and the configured VCOIN master.
            storage.pendingReleaseAmount = releasable;
            storage.pendingReleaseQueryId = msg.queryId;
            storage.save();

            val forwardPayload = beginCell().storeUint(0, 1).endCell().beginParse();
            val transfer = createMessage({
                bounce: true,
                dest: calcAddressOfJettonWallet(
                    contract.getAddress(),
                    storage.minterAddress,
                    vcoinJettonWalletCompiledCode(),
                ),
                value: grams("0.5"),
                body: AskToTransfer {
                    queryId: msg.queryId,
                    jettonAmount: releasable,
                    transferRecipient: storage.beneficiaryAddress,
                    sendExcessesTo: contract.getAddress(),
                    customPayload: null,
                    forwardTonAmount: 0,
                    forwardPayload,
                },
            });
            transfer.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        ReturnExcessesBack => {
            var storage = lazy VcoinVestingEscrowStorage.fromCell(contract.getData());
            assert (storage.pendingReleaseAmount > 0) throw ERROR_INVALID_OP;
            assert (msg.queryId == storage.pendingReleaseQueryId) throw ERROR_INVALID_OP;
            val beneficiaryWallet = calcAddressOfJettonWallet(
                storage.beneficiaryAddress,
                storage.minterAddress,
                vcoinJettonWalletCompiledCode(),
            );
            assert (in.senderAddress == beneficiaryWallet) throw ERROR_NOT_VALID_WALLET;
            storage.releasedAmount += storage.pendingReleaseAmount;
            storage.pendingReleaseAmount = 0;
            storage.pendingReleaseQueryId = 0;
            storage.save();
        }

        VcoinTransferFailed => {
            var storage = lazy VcoinVestingEscrowStorage.fromCell(contract.getData());
            assert (storage.pendingReleaseAmount > 0) throw ERROR_INVALID_OP;
            assert (msg.queryId == storage.pendingReleaseQueryId) throw ERROR_INVALID_OP;
            assert (msg.jettonAmount == storage.pendingReleaseAmount) throw ERROR_INVALID_OP;
            assert (msg.ownerAddress == contract.getAddress()) throw ERROR_INVALID_OP;
            val escrowWallet = calcAddressOfJettonWallet(
                contract.getAddress(),
                storage.minterAddress,
                vcoinJettonWalletCompiledCode(),
            );
            assert (in.senderAddress == escrowWallet) throw ERROR_NOT_VALID_WALLET;
            storage.pendingReleaseAmount = 0;
            storage.pendingReleaseQueryId = 0;
            storage.save();
        }

        TopUpTons => {
            var storage = lazy VcoinVestingEscrowStorage.fromCell(contract.getData());
            validateVcoinVestingConfig(storage);
            assert (in.senderAddress == storage.minterAddress) throw ERROR_NOT_OWNER;
            val ready = createMessage({
                bounce: BounceMode.NoBounce,
                dest: storage.minterAddress,
                value: 0,
                body: VcoinVestingEscrowReady {
                    queryId: storage.configQueryId,
                    vestingKind: storage.vestingKind,
                    escrowAddress: contract.getAddress(),
                },
            });
            ready.send(SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        else => throw 0xFFFF,
    }
}

get fun get_vcoin_vesting_state(): tuple {
    val storage = lazy VcoinVestingEscrowStorage.fromCell(contract.getData());
    val vested = vcoinVestedAmount(storage, blockchain.now());
    val claimable = vested > storage.releasedAmount ? vested - storage.releasedAmount : 0;
    return [
        storage.vestingKind,
        storage.minterAddress,
        storage.beneficiaryAddress,
        storage.controllerAddress,
        storage.allocationAmount,
        storage.startTime,
        storage.duration,
        storage.deposited,
        storage.releasedAmount,
        storage.pendingReleaseAmount,
        storage.pendingReleaseQueryId,
        vested,
        claimable,
    ];
}
