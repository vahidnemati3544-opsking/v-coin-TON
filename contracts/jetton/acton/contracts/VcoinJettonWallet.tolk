import "@stdlib/gas-payments"
import "errors"
import "fees-management"
import "messages"
import "sharding"
import "vcoin-jetton-utils"
import "vcoin-messages"
import "vcoin-storage"

contract VcoinJettonWallet {
    author: "V COIN"
    version: "1.0.0"
    description: "VCOIN TEP-74 Jetton Wallet with replay-safe one-time genesis acknowledgement"
    incomingMessages: VcoinAllowedMessageToWallet
    storage: VcoinWalletStorage
}

type VcoinAllowedMessageToWallet = AskToTransfer | AskToBurn | InternalTransferStep | TopUpTons

type VcoinBounceOpToHandle =
    | InternalTransferStep
    | BurnNotificationForMinter
    | VcoinGenesisCreditAck

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = VcoinBounceOpToHandle.fromSlice(in.bouncedBody);
    val restoreAmount: coins = match (msg) {
        InternalTransferStep => msg.jettonAmount,
        BurnNotificationForMinter => msg.jettonAmount,
        VcoinGenesisCreditAck => grams("0"),
    };
    var storage = lazy VcoinWalletStorage.load();
    storage.jettonBalance += restoreAmount;
    storage.save();

    match (msg) {
        InternalTransferStep => {
            if (
                msg.sendExcessesTo != null &&
                msg.sendExcessesTo == storage.ownerAddress
            ) {
                val failedMsg = createMessage({
                    bounce: BounceMode.NoBounce,
                    dest: storage.ownerAddress,
                    value: 0,
                    body: VcoinTransferFailed {
                        queryId: msg.queryId,
                        jettonAmount: msg.jettonAmount,
                        walletOwner: storage.ownerAddress,
                    },
                });
                failedMsg.send(
                    SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_IGNORE_ERRORS,
                );
            }
        }
        BurnNotificationForMinter => {}
        VcoinGenesisCreditAck => {}
    }
}

fun sendGenesisCreditAck(storage: VcoinWalletStorage, queryId: uint64, amount: coins) {
    reserveGramsOnBalance(grams("0.1"), RESERVE_MODE_AT_MOST);
    val ack = createMessage({
        bounce: BounceMode.Only256BitsOfBody,
        dest: storage.minterAddress,
        value: grams("0.1"),
        body: VcoinGenesisCreditAck {
            queryId,
            jettonAmount: amount,
            ownerAddress: storage.ownerAddress,
        },
    });
    ack.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy VcoinAllowedMessageToWallet.fromSlice(in.body);

    match (msg) {
        InternalTransferStep => {
            var storage = lazy VcoinWalletStorage.load();

            if (in.senderAddress == storage.minterAddress) {
                assert (msg.transferInitiator == null) throw ERROR_INVALID_MESSAGE;
                assert (msg.queryId != 0) throw ERROR_INVALID_MESSAGE;
                assert (msg.jettonAmount > 0) throw ERROR_INVALID_MESSAGE;
                assert (msg.forwardTonAmount == 0) throw ERROR_INVALID_MESSAGE;
                assert (msg.sendExcessesTo == null) throw ERROR_INVALID_MESSAGE;

                if (storage.genesisCredited) {
                    assert (storage.genesisQueryId == msg.queryId) throw ERROR_INVALID_MESSAGE;
                    assert (storage.genesisAmount == msg.jettonAmount) throw ERROR_INVALID_MESSAGE;
                } else {
                    storage.jettonBalance += msg.jettonAmount;
                    storage.genesisCredited = true;
                    storage.genesisQueryId = msg.queryId;
                    storage.genesisAmount = msg.jettonAmount;
                    storage.save();
                }
                sendGenesisCreditAck(storage, msg.queryId, msg.jettonAmount);
                return;
            }

            assert (msg.transferInitiator != null) throw ERROR_NOT_VALID_WALLET;
            assert (
                in.senderAddress ==
                calcAddressOfVcoinJettonWallet(
                    msg.transferInitiator,
                    storage.minterAddress,
                    contract.getCode(),
                )
            ) throw ERROR_NOT_VALID_WALLET;

            storage.jettonBalance += msg.jettonAmount;
            storage.save();

            if (msg.forwardTonAmount != 0) {
                val notifyOwnerMsg = createMessage({
                    bounce: BounceMode.NoBounce,
                    dest: storage.ownerAddress,
                    value: msg.forwardTonAmount,
                    body: TransferNotificationForRecipient {
                        queryId: msg.queryId,
                        jettonAmount: msg.jettonAmount,
                        transferInitiator: msg.transferInitiator,
                        forwardPayload: msg.forwardPayload,
                    },
                });
                notifyOwnerMsg.send(
                    SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
                );
            }

            if (msg.sendExcessesTo != null) {
                val toLeaveOnBalance = contract.getOriginalBalance() - in.valueCoins +
                    contract.getStorageDuePayment();
                reserveGramsOnBalance(
                    max(toLeaveOnBalance, calculateJettonWalletMinStorageFee()),
                    RESERVE_MODE_AT_MOST,
                );
                val excessesMsg = createMessage({
                    bounce: BounceMode.NoBounce,
                    dest: msg.sendExcessesTo,
                    value: 0,
                    body: ReturnExcessesBack { queryId: msg.queryId },
                });
                // SAFETY: reserveGramsOnBalance above preserves the calculated wallet storage floor;
                // only the remaining TON balance is returned as optional transfer excess.
                excessesMsg.send(SEND_MODE_CARRY_ALL_BALANCE | SEND_MODE_IGNORE_ERRORS);
            }
        }

        AskToTransfer => {
            msg.forwardPayload.checkIsCorrectTlbEither();
            assert (
                msg.transferRecipient.getWorkchain() == MY_WORKCHAIN
            ) throw ERROR_WRONG_WORKCHAIN;
            checkAmountIsEnoughToTransfer(
                in.valueCoins,
                msg.forwardTonAmount,
                in.originalForwardFee,
            );

            var storage = lazy VcoinWalletStorage.load();
            assert (in.senderAddress == storage.ownerAddress) throw ERROR_NOT_OWNER;
            assert (storage.jettonBalance >= msg.jettonAmount) throw ERROR_BALANCE_ERROR;
            storage.jettonBalance -= msg.jettonAmount;
            storage.save();

            val deployMsg = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: calcDeployedVcoinJettonWallet(
                    msg.transferRecipient,
                    storage.minterAddress,
                    contract.getCode(),
                ),
                value: 0,
                body: InternalTransferStep {
                    queryId: msg.queryId,
                    jettonAmount: msg.jettonAmount,
                    transferInitiator: storage.ownerAddress,
                    sendExcessesTo: msg.sendExcessesTo,
                    forwardTonAmount: msg.forwardTonAmount,
                    forwardPayload: msg.forwardPayload,
                },
            });
            deployMsg.send(
                SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
            );
        }

        AskToBurn => {
            checkAmountIsEnoughToBurn(in.valueCoins);
            var storage = lazy VcoinWalletStorage.load();
            assert (in.senderAddress == storage.ownerAddress) throw ERROR_NOT_OWNER;
            assert (storage.jettonBalance >= msg.jettonAmount) throw ERROR_BALANCE_ERROR;
            storage.jettonBalance -= msg.jettonAmount;
            storage.save();

            val notifyMinterMsg = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: storage.minterAddress,
                value: 0,
                body: BurnNotificationForMinter {
                    queryId: msg.queryId,
                    jettonAmount: msg.jettonAmount,
                    burnInitiator: storage.ownerAddress,
                    sendExcessesTo: msg.sendExcessesTo,
                },
            });
            notifyMinterMsg.send(
                SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
            );
        }

        TopUpTons => {
            // Accept TON for storage and transaction fees.
        }

        else => throw ERROR_WRONG_OP,
    }
}

get fun get_wallet_data(): VcoinWalletDataReply {
    val storage = lazy VcoinWalletStorage.load();
    return {
        jettonBalance: storage.jettonBalance,
        ownerAddress: storage.ownerAddress,
        minterAddress: storage.minterAddress,
        jettonWalletCode: contract.getCode(),
        genesisCredited: storage.genesisCredited,
        genesisQueryId: storage.genesisQueryId,
        genesisAmount: storage.genesisAmount,
    };
}
