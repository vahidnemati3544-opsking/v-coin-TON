import "errors"
import "messages"
import "vcoin-genesis-config"
import "vcoin-jetton-utils"
import "vcoin-messages"
import "vcoin-vesting-calendar"
import "vcoin-vesting-messages"
import "vcoin-vesting-storage"

const VCOIN_FOUNDER_VESTING_TRANCHE_COUNT: uint8 = 48
const VCOIN_VESTING_RELEASE_TON_VALUE = grams("1")
const VCOIN_VESTING_RELEASE_MIN_CALL_VALUE = grams("1.2")

contract VcoinFounderVesting {
    author: "V COIN"
    version: "1.0.0"
    description: "48-month UTC calendar vesting for the VCOIN founder allocation"
    incomingMessages: VcoinFounderVestingMessages
    storage: VcoinFounderVestingStorage
}

type VcoinFounderVestingMessages =
    | SetVcoinVestingMaster
    | ActivateVcoinVesting
    | ReleaseVcoinVesting
    | ReturnExcessesBack
    | VcoinTransferFailed
    | TopUpTons

fun vcoinFounderDueTrancheCount(
    startTimestamp: uint64,
    releasedTranches: uint8,
    currentTimestamp: int,
): uint8 {
    var dueTranches = releasedTranches;
    while (dueTranches < VCOIN_FOUNDER_VESTING_TRANCHE_COUNT) {
        val nextTranche = dueTranches + 1;
        val dueTimestamp = vcoinMonthlyVestingDueTimestamp(
            startTimestamp as int,
            nextTranche as int,
        );
        if (currentTimestamp >= dueTimestamp) {
            dueTranches = nextTranche;
        } else {
            break;
        }
    }
    return dueTranches;
}

fun vcoinFounderReleaseAmount(fromTranche: uint8, toTranche: uint8): coins {
    val trancheCount = toTranche - fromTranche;
    val baseAmount: coins = vcoinFounderTrancheBaseUnits() * trancheCount;
    if (toTranche == VCOIN_FOUNDER_VESTING_TRANCHE_COUNT) {
        return baseAmount + VCOIN_FOUNDER_ALLOCATION_BASE_UNITS % 48;
    }
    return baseAmount;
}

fun vcoinClearPendingVesting(state: VcoinFounderVestingState): VcoinFounderVestingState {
    var updated = state;
    updated.pendingTranches = 0;
    updated.pendingQueryId = 0;
    updated.pendingAmount = 0;
    return updated;
}

fun vcoinFounderWalletAddress(masterAddress: address): address {
    return calcAddressOfVcoinJettonWallet(
        contract.getAddress(),
        masterAddress,
        getVcoinJettonWalletCode(),
    );
}

fun vcoinBeneficiaryWalletAddress(
    beneficiary: address,
    masterAddress: address,
): address {
    return calcAddressOfVcoinJettonWallet(
        beneficiary,
        masterAddress,
        getVcoinJettonWalletCode(),
    );
}

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = lazy AskToTransfer.fromSlice(in.bouncedBody);
    var storage = lazy VcoinFounderVestingStorage.load();
    var state = storage.state.load();
    if (
        state.pendingTranches > 0 &&
        msg.queryId == state.pendingQueryId &&
        msg.jettonAmount == state.pendingAmount
    ) {
        state = vcoinClearPendingVesting(state);
        storage.state = state.toCell();
        storage.save();
    }
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy VcoinFounderVestingMessages.fromSlice(in.body);

    match (msg) {
        SetVcoinVestingMaster => {
            var storage = lazy VcoinFounderVestingStorage.load();
            var config = storage.config.load();
            assert (in.senderAddress == config.activationController) throw ERROR_NOT_OWNER;
            assert (config.masterAddress == null) throw ERROR_INVALID_MESSAGE;
            config.masterAddress = msg.masterAddress;
            storage.config = config.toCell();
            storage.save();
        }

        ActivateVcoinVesting => {
            var storage = lazy VcoinFounderVestingStorage.load();
            val config = storage.config.load();
            var state = storage.state.load();
            assert (in.senderAddress == config.activationController) throw ERROR_NOT_OWNER;
            assert (config.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (state.startTimestamp == 0) throw ERROR_INVALID_MESSAGE;
            state.startTimestamp = blockchain.now as uint64;
            storage.state = state.toCell();
            storage.save();
        }

        ReleaseVcoinVesting => {
            var storage = lazy VcoinFounderVestingStorage.load();
            val config = storage.config.load();
            var state = storage.state.load();
            assert (config.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (state.startTimestamp > 0) throw ERROR_INVALID_MESSAGE;
            assert (state.pendingTranches == 0) throw ERROR_INVALID_MESSAGE;
            assert (in.valueCoins >= VCOIN_VESTING_RELEASE_MIN_CALL_VALUE) throw ERROR_NOT_ENOUGH_GAS;

            val dueTranches = vcoinFounderDueTrancheCount(
                state.startTimestamp,
                state.releasedTranches,
                blockchain.now,
            );
            assert (dueTranches > state.releasedTranches) throw ERROR_INVALID_MESSAGE;

            val amount = vcoinFounderReleaseAmount(state.releasedTranches, dueTranches);
            assert (amount > 0) throw ERROR_INVALID_MESSAGE;
            val queryId = state.nextQueryId == 0 ? 1 : state.nextQueryId;
            state.pendingTranches = dueTranches - state.releasedTranches;
            state.pendingQueryId = queryId;
            state.pendingAmount = amount;
            state.nextQueryId = queryId + 1;
            storage.state = state.toCell();
            storage.save();

            val walletAddress = vcoinFounderWalletAddress(config.masterAddress!);
            val transfer = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: walletAddress,
                value: VCOIN_VESTING_RELEASE_TON_VALUE,
                body: AskToTransfer {
                    queryId,
                    jettonAmount: amount,
                    transferRecipient: config.beneficiary,
                    sendExcessesTo: contract.getAddress(),
                    customPayload: null,
                    forwardTonAmount: 0,
                    forwardPayload: beginCell().endCell().beginParse(),
                },
            });
            transfer.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        ReturnExcessesBack => {
            var storage = lazy VcoinFounderVestingStorage.load();
            val config = storage.config.load();
            var state = storage.state.load();
            assert (config.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (state.pendingTranches > 0) throw ERROR_INVALID_MESSAGE;
            assert (msg.queryId == state.pendingQueryId) throw ERROR_INVALID_MESSAGE;
            assert (
                in.senderAddress ==
                vcoinBeneficiaryWalletAddress(config.beneficiary, config.masterAddress!)
            ) throw ERROR_NOT_VALID_WALLET;

            state.releasedTranches += state.pendingTranches;
            assert (state.releasedTranches <= VCOIN_FOUNDER_VESTING_TRANCHE_COUNT) throw ERROR_INVALID_MESSAGE;
            state = vcoinClearPendingVesting(state);
            storage.state = state.toCell();
            storage.save();
        }

        VcoinTransferFailed => {
            var storage = lazy VcoinFounderVestingStorage.load();
            val config = storage.config.load();
            var state = storage.state.load();
            assert (config.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (state.pendingTranches > 0) throw ERROR_INVALID_MESSAGE;
            assert (msg.queryId == state.pendingQueryId) throw ERROR_INVALID_MESSAGE;
            assert (msg.jettonAmount == state.pendingAmount) throw ERROR_INVALID_MESSAGE;
            assert (msg.walletOwner == contract.getAddress()) throw ERROR_INVALID_MESSAGE;
            assert (
                in.senderAddress == vcoinFounderWalletAddress(config.masterAddress!)
            ) throw ERROR_NOT_VALID_WALLET;

            state = vcoinClearPendingVesting(state);
            storage.state = state.toCell();
            storage.save();
        }

        TopUpTons => {
            // Accept TON for vesting release transaction fees.
        }

        else => throw ERROR_WRONG_OP,
    }
}

get fun get_vesting_status(): VcoinFounderVestingStatusReply {
    val storage = lazy VcoinFounderVestingStorage.load();
    val config = storage.config.load();
    val state = storage.state.load();
    val dueTranches = state.startTimestamp == 0
        ? state.releasedTranches
        : vcoinFounderDueTrancheCount(
            state.startTimestamp,
            state.releasedTranches,
            blockchain.now,
        );
    val claimableTranches = state.pendingTranches > 0
        ? 0
        : dueTranches - state.releasedTranches;
    val claimableAmount = claimableTranches == 0
        ? grams("0")
        : vcoinFounderReleaseAmount(
            state.releasedTranches,
            dueTranches,
        );
    return {
        beneficiary: config.beneficiary,
        activationController: config.activationController,
        masterAddress: config.masterAddress,
        startTimestamp: state.startTimestamp,
        releasedTranches: state.releasedTranches,
        pendingTranches: state.pendingTranches,
        pendingQueryId: state.pendingQueryId,
        pendingAmount: state.pendingAmount,
        claimableTranches,
        claimableAmount,
    };
}

get fun get_vesting_wallet_address(): address? {
    val config = lazy VcoinFounderVestingStorage.load().config.load();
    if (config.masterAddress == null) {
        return null;
    }
    return vcoinFounderWalletAddress(config.masterAddress!);
}

get fun get_beneficiary_wallet_address(): address? {
    val config = lazy VcoinFounderVestingStorage.load().config.load();
    if (config.masterAddress == null) {
        return null;
    }
    return vcoinBeneficiaryWalletAddress(config.beneficiary, config.masterAddress!);
}
