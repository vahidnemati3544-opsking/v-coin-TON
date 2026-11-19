import "errors"
import "messages"
import "vcoin-genesis-config"
import "vcoin-messages"
import "vcoin-vesting-calendar"
import "vcoin-vesting-messages"
import "vcoin-vesting-storage"

const VCOIN_FOUNDER_VESTING_TRANCHE_COUNT: uint8 = 48
const VCOIN_VESTING_OWN_WALLET_QUERY_ID: uint64 = 0x5643564553540001
const VCOIN_VESTING_BENEFICIARY_WALLET_QUERY_ID: uint64 = 0x5643564553540002
const VCOIN_VESTING_WALLET_QUERY_TON_VALUE = grams("0.1")
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
    | RefreshVcoinVestingWalletAddresses
    | ResponseWalletAddress
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

fun sendVcoinVestingWalletAddressRequests(masterAddress: address, beneficiary: address) {
    val ownWalletRequest = createMessage({
        bounce: BounceMode.Only256BitsOfBody,
        dest: masterAddress,
        value: VCOIN_VESTING_WALLET_QUERY_TON_VALUE,
        body: RequestWalletAddress {
            queryId: VCOIN_VESTING_OWN_WALLET_QUERY_ID,
            ownerAddress: contract.getAddress(),
            includeOwnerAddress: false,
        },
    });
    ownWalletRequest.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);

    val beneficiaryWalletRequest = createMessage({
        bounce: BounceMode.Only256BitsOfBody,
        dest: masterAddress,
        value: VCOIN_VESTING_WALLET_QUERY_TON_VALUE,
        body: RequestWalletAddress {
            queryId: VCOIN_VESTING_BENEFICIARY_WALLET_QUERY_ID,
            ownerAddress: beneficiary,
            includeOwnerAddress: false,
        },
    });
    beneficiaryWalletRequest.send(
        SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
    );
}

type VcoinVestingBounceMessages =
    | VcoinVestingAskToTransferBounce
    | VcoinVestingRequestWalletAddressBounce

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = lazy VcoinVestingBounceMessages.fromSlice(in.bouncedBody);
    match (msg) {
        VcoinVestingAskToTransferBounce => {
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
        VcoinVestingRequestWalletAddressBounce => {
            // The activation controller can retry wallet-address discovery.
        }
    }
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy VcoinFounderVestingMessages.fromSlice(in.body);

    match (msg) {
        SetVcoinVestingMaster => {
            var storage = lazy VcoinFounderVestingStorage.load();
            var config = storage.config.load();
            assert (in.senderAddress == config.activationController) throw ERROR_NOT_OWNER;
            var wallets = config.wallets.load();
            assert (wallets.masterAddress == null) throw ERROR_INVALID_MESSAGE;
            assert (in.valueCoins >= grams("0.3")) throw ERROR_NOT_ENOUGH_GAS;
            wallets.masterAddress = msg.masterAddress;
            config.wallets = wallets.toCell();
            storage.config = config.toCell();
            storage.save();
            sendVcoinVestingWalletAddressRequests(msg.masterAddress, config.beneficiary);
        }

        RefreshVcoinVestingWalletAddresses => {
            val storage = lazy VcoinFounderVestingStorage.load();
            val config = storage.config.load();
            assert (in.senderAddress == config.activationController) throw ERROR_NOT_OWNER;
            val wallets = config.wallets.load();
            assert (wallets.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (in.valueCoins >= grams("0.3")) throw ERROR_NOT_ENOUGH_GAS;
            sendVcoinVestingWalletAddressRequests(wallets.masterAddress!, config.beneficiary);
        }

        ResponseWalletAddress => {
            var storage = lazy VcoinFounderVestingStorage.load();
            var config = storage.config.load();
            var wallets = config.wallets.load();
            assert (wallets.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (in.senderAddress == wallets.masterAddress!) throw ERROR_NOT_OWNER;
            assert (msg.jettonWalletAddress != null) throw ERROR_INVALID_MESSAGE;

            if (msg.queryId == VCOIN_VESTING_OWN_WALLET_QUERY_ID) {
                if (wallets.ownWalletAddress != null) {
                    assert (wallets.ownWalletAddress == msg.jettonWalletAddress!) throw ERROR_INVALID_MESSAGE;
                } else {
                    wallets.ownWalletAddress = msg.jettonWalletAddress;
                }
            } else if (msg.queryId == VCOIN_VESTING_BENEFICIARY_WALLET_QUERY_ID) {
                if (wallets.beneficiaryWalletAddress != null) {
                    assert (
                        wallets.beneficiaryWalletAddress == msg.jettonWalletAddress!
                    ) throw ERROR_INVALID_MESSAGE;
                } else {
                    wallets.beneficiaryWalletAddress = msg.jettonWalletAddress;
                }
            } else {
                throw ERROR_INVALID_MESSAGE;
            }

            config.wallets = wallets.toCell();
            storage.config = config.toCell();
            storage.save();
        }

        ActivateVcoinVesting => {
            var storage = lazy VcoinFounderVestingStorage.load();
            val config = storage.config.load();
            var state = storage.state.load();
            assert (in.senderAddress == config.activationController) throw ERROR_NOT_OWNER;
            val wallets = config.wallets.load();
            assert (wallets.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (wallets.ownWalletAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (wallets.beneficiaryWalletAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (state.startTimestamp == 0) throw ERROR_INVALID_MESSAGE;
            state.startTimestamp = blockchain.now() as uint64;
            storage.state = state.toCell();
            storage.save();
        }

        ReleaseVcoinVesting => {
            var storage = lazy VcoinFounderVestingStorage.load();
            val config = storage.config.load();
            var state = storage.state.load();
            val wallets = config.wallets.load();
            assert (wallets.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (wallets.ownWalletAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (state.startTimestamp > 0) throw ERROR_INVALID_MESSAGE;
            assert (state.pendingTranches == 0) throw ERROR_INVALID_MESSAGE;
            assert (in.valueCoins >= VCOIN_VESTING_RELEASE_MIN_CALL_VALUE) throw ERROR_NOT_ENOUGH_GAS;

            val dueTranches = vcoinFounderDueTrancheCount(
                state.startTimestamp,
                state.releasedTranches,
                blockchain.now(),
            );
            assert (dueTranches > state.releasedTranches) throw ERROR_INVALID_MESSAGE;

            val amount = vcoinFounderReleaseAmount(state.releasedTranches, dueTranches);
            assert (amount > 0) throw ERROR_INVALID_MESSAGE;
            val queryId = state.nextQueryId == 0 ? (1 as uint64) : state.nextQueryId;
            state.pendingTranches = dueTranches - state.releasedTranches;
            state.pendingQueryId = queryId;
            state.pendingAmount = amount;
            state.nextQueryId = queryId + (1 as uint64);
            storage.state = state.toCell();
            storage.save();

            val walletAddress = wallets.ownWalletAddress!;
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
                    forwardPayload: PayloadInline { value: beginCell().endCell().beginParse() },
                },
            });
            transfer.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        ReturnExcessesBack => {
            var storage = lazy VcoinFounderVestingStorage.load();
            val config = storage.config.load();
            var state = storage.state.load();
            val wallets = config.wallets.load();
            assert (wallets.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (wallets.beneficiaryWalletAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (state.pendingTranches > 0) throw ERROR_INVALID_MESSAGE;
            assert (msg.queryId == state.pendingQueryId) throw ERROR_INVALID_MESSAGE;
            assert (
                in.senderAddress == wallets.beneficiaryWalletAddress!
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
            val wallets = config.wallets.load();
            assert (wallets.masterAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (wallets.ownWalletAddress != null) throw ERROR_INVALID_MESSAGE;
            assert (state.pendingTranches > 0) throw ERROR_INVALID_MESSAGE;
            assert (msg.queryId == state.pendingQueryId) throw ERROR_INVALID_MESSAGE;
            assert (msg.jettonAmount == state.pendingAmount) throw ERROR_INVALID_MESSAGE;
            assert (msg.walletOwner == contract.getAddress()) throw ERROR_INVALID_MESSAGE;
            assert (
                in.senderAddress == wallets.ownWalletAddress!
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
    val wallets = config.wallets.load();
    val state = storage.state.load();
    val dueTranches = state.startTimestamp == 0
        ? state.releasedTranches
        : vcoinFounderDueTrancheCount(
            state.startTimestamp,
            state.releasedTranches,
            blockchain.now(),
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
        masterAddress: wallets.masterAddress,
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
    return config.wallets.load().ownWalletAddress;
}

get fun get_beneficiary_wallet_address(): address? {
    val config = lazy VcoinFounderVestingStorage.load().config.load();
    return config.wallets.load().beneficiaryWalletAddress;
}
