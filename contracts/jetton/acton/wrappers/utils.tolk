import "@acton/emulation/network"
import "@acton/emulation/scripts"
import "VcoinMinter.gen"
import "JettonWallet.gen"
import "../contracts/messages"
import "../contracts/storage"

fun VcoinMinter.sendDiscovery(
    self,
    from: address,
    ownerAddress: address,
    includeOwnerAddress: bool,
    value: coins = grams("0.1"),
): SendResultList {
    val outMessage = createMessage({
        bounce: false,
        value,
        dest: self.address,
        body: RequestWalletAddress { queryId: 0, ownerAddress, includeOwnerAddress },
    });
    return net.send(from, outMessage);
}

fun VcoinMinter.sendDeploy(self, from: address, params: SendParams): SendResultList {
    val outMessage = createMessage({
        bounce: false,
        value: params.value,
        dest: { workchain: 0, stateInit: self.stateInit! },
        body: TopUpTons {},
    });
    return net.send(from, outMessage);
}

fun VcoinMinter.sendMint(
    self,
    from: address,
    recipient: address,
    jettonAmount: int,
    forwardTonAmount: int,
    totalTonAmount: int,
    customPayload: cell? = null,
): SendResultList {
    val forwardPayload = beginCell().storeMaybeRef(customPayload).endCell().beginParse();
    val outMessage = createMessage({
        bounce: false,
        value: totalTonAmount + grams("0.015"),
        dest: self.address,
        body: MintNewJettons {
            queryId: 0,
            mintRecipient: recipient,
            tonAmount: totalTonAmount,
            internalTransferMsg: InternalTransferStep {
                queryId: 0,
                jettonAmount,
                transferInitiator: null,
                sendExcessesTo: self.address,
                forwardTonAmount,
                forwardPayload,
            }.toCell(),
        },
    });
    return net.send(from, outMessage);
}

fun VcoinMinter.sendDropAdmin(self, from: address): SendResultList {
    val outMessage = createMessage({
        bounce: false,
        value: grams("0.05"),
        dest: self.address,
        body: DropMinterAdmin { queryId: 0 },
    });
    return net.send(from, outMessage);
}

fun VcoinMinter.getTotalSupply(self): int {
    return self.getJettonData().totalSupply;
}

fun VcoinMinter.getAdminAddress(self): address? {
    return self.getJettonData().adminAddress;
}

fun VcoinMinter.getContent(self): cell {
    return self.getJettonData().jettonContent;
}

fun JettonWallet.getJettonBalance(self): coins {
    if (!scripts.isContractDeployed(self.address)) {
        return 0;
    }
    val result: JettonWalletDataReply = net.runGetMethod(self.address, "get_wallet_data");
    return result.jettonBalance;
}

fun JettonWallet.sendTransferPayloadInline(
    self,
    from: address,
    value: int,
    jettonAmount: int,
    recipient: address,
    responseAddress: address,
    customPayload: cell?,
    forwardTonAmount: int,
    forwardPayload: slice,
): SendResultList {
    return self.sendAskToTransfer(
        from, 0, jettonAmount, recipient, responseAddress, customPayload,
        forwardTonAmount, PayloadInline { value: forwardPayload }, { value, bounce: true },
    );
}

fun JettonWallet.sendTransferPayloadInRef(
    self,
    from: address,
    value: int,
    jettonAmount: int,
    recipient: address,
    responseAddress: address,
    customPayload: cell?,
    forwardTonAmount: int,
    forwardPayload: cell,
): SendResultList {
    return self.sendAskToTransfer(
        from, 0, jettonAmount, recipient, responseAddress, customPayload,
        forwardTonAmount, PayloadInRef { value: forwardPayload as Cell<RemainingBitsAndRefs> },
        { value, bounce: true },
    );
}

fun JettonWallet.sendTransferPayloadAuto(
    self,
    from: address,
    value: int,
    jettonAmount: int,
    recipient: address,
    responseAddress: address,
    customPayload: cell?,
    forwardTonAmount: int,
    forwardPayload: slice,
): SendResultList {
    val (bodyBits, bodyRefs) = AskToTransfer {
        queryId: 0,
        jettonAmount,
        transferRecipient: recipient,
        sendExcessesTo: responseAddress,
        customPayload,
        forwardTonAmount,
        forwardPayload: createEmptySlice(),
    }.toCell().beginParse().remainingBitsAndRefsCount();
    val fitsInline = (1023 - bodyBits - 1) >= forwardPayload.remainingBitsCount() &&
        (4 - bodyRefs) > forwardPayload.remainingRefsCount();
    return fitsInline
        ? self.sendTransferPayloadInline(
            from, value, jettonAmount, recipient, responseAddress, customPayload,
            forwardTonAmount, forwardPayload,
        )
        : self.sendTransferPayloadInRef(
            from, value, jettonAmount, recipient, responseAddress, customPayload,
            forwardTonAmount, forwardPayload.toCell(),
        );
}

fun JettonWallet.sendBurn(
    self,
    from: address,
    value: int,
    jettonAmount: int,
    responseAddress: address,
    customPayload: cell?,
): SendResultList {
    val outMessage = createMessage({
        bounce: false,
        value,
        dest: self.address,
        body: AskToBurn {
            queryId: 0,
            jettonAmount,
            sendExcessesTo: responseAddress,
            customPayload,
        },
    });
    return net.send(from, outMessage);
}
