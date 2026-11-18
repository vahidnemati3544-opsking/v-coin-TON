import "@gen/JettonWallet.code"
import "errors"
import "fees-management"
import "jetton-utils"
import "messages"
import "sharding"
import "storage"

const VCOIN_MAX_SUPPLY = 10000000000000000

contract VcoinMinter {
    author: "V COIN"
    version: "1.0.0"
    description: "VCOIN fixed-supply TEP-74 Jetton minter"
    incomingMessages: AllowedMessageToMinter
    storage: MinterStorage
}

type AllowedMessageToMinter =
    | MintNewJettons
    | BurnNotificationForMinter
    | RequestWalletAddress
    | DropMinterAdmin
    | TopUpTons

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = lazy InternalTransferStep.fromSlice(in.bouncedBody);
    var storage = lazy MinterStorage.load();
    storage.totalSupply -= msg.jettonAmount;
    storage.save();
}

fun assertSenderIsAdmin(senderAddress: address, adminAddress: address?) {
    assert (adminAddress != null) throw ERROR_NOT_OWNER;
    assert (senderAddress == adminAddress!) throw ERROR_NOT_OWNER;
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedMessageToMinter.fromSlice(in.body);
    match (msg) {
        BurnNotificationForMinter => {
            var storage = lazy MinterStorage.load();
            val walletCode = jettonWalletCompiledCode();
            assert (in.senderAddress == calcAddressOfJettonWallet(msg.burnInitiator, contract.getAddress(), walletCode)) throw ERROR_NOT_VALID_WALLET;
            storage.totalSupply -= msg.jettonAmount;
            storage.save();
            if (msg.sendExcessesTo == null) { return; }
            val excesses = createMessage({
                bounce: BounceMode.NoBounce,
                dest: msg.sendExcessesTo,
                value: 0,
                body: ReturnExcessesBack { queryId: msg.queryId },
            });
            excesses.send(SEND_MODE_IGNORE_ERRORS | SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE);
        }
        RequestWalletAddress => {
            val ownerAddress: Cell<address>? = msg.includeOwnerAddress ? msg.ownerAddress.toCell() : null;
            var walletAddress: address? = null;
            if (msg.ownerAddress.getWorkchain() == MY_WORKCHAIN) {
                walletAddress = calcAddressOfJettonWallet(msg.ownerAddress, contract.getAddress(), jettonWalletCompiledCode());
            }
            val response = createMessage({
                bounce: BounceMode.NoBounce,
                dest: in.senderAddress,
                value: 0,
                body: ResponseWalletAddress {
                    queryId: msg.queryId,
                    jettonWalletAddress: walletAddress,
                    ownerAddress,
                },
            });
            response.send(SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }
        MintNewJettons => {
            var storage = lazy MinterStorage.load();
            assertSenderIsAdmin(in.senderAddress, storage.adminAddress);
            assert (msg.mintRecipient.getWorkchain() == MY_WORKCHAIN) throw ERROR_WRONG_WORKCHAIN;
            val internalTransfer = lazy msg.internalTransferMsg.load({ throwIfOpcodeDoesNotMatch: ERROR_INVALID_OP });
            internalTransfer.forwardPayload.checkIsCorrectTlbEither();
            assert (internalTransfer.jettonAmount > 0) throw ERROR_INVALID_MESSAGE;
            assert (storage.totalSupply + internalTransfer.jettonAmount <= VCOIN_MAX_SUPPLY) throw ERROR_SUPPLY_CAP;
            checkAmountIsEnoughToTransfer(msg.tonAmount, internalTransfer.forwardTonAmount, in.originalForwardFee);
            storage.totalSupply += internalTransfer.jettonAmount;
            storage.save();
            reserveGramsOnBalance(grams("0.01"), RESERVE_MODE_EXACT_AMOUNT);
            val deployMsg = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: calcDeployedJettonWallet(msg.mintRecipient, contract.getAddress(), jettonWalletCompiledCode()),
                value: msg.tonAmount,
                body: msg.internalTransferMsg,
            });
            deployMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }
        DropMinterAdmin => {
            var storage = lazy MinterStorage.load();
            assertSenderIsAdmin(in.senderAddress, storage.adminAddress);
            storage.adminAddress = null;
            storage.nextAdminAddress = null;
            storage.save();
        }
        TopUpTons => { }
        else => throw ERROR_WRONG_OP,
    }
}

get fun get_jetton_data(): JettonDataReply {
    val storage = lazy MinterStorage.load();
    return {
        totalSupply: storage.totalSupply,
        mintable: storage.adminAddress != null,
        adminAddress: storage.adminAddress,
        jettonContent: storage.metadata as Cell<OnchainMetadataReply>,
        jettonWalletCode: jettonWalletCompiledCode(),
    };
}

get fun get_wallet_address(ownerAddress: address): address {
    return calcAddressOfJettonWallet(ownerAddress, contract.getAddress(), jettonWalletCompiledCode());
}
