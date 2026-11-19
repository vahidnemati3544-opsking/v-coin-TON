import "errors"
import "vcoin-messages"

const VCOIN_GENESIS_REQUEST_TON_VALUE = grams("0.5")
const VCOIN_GENESIS_COORDINATOR_MIN_CALL_VALUE = grams("3")

contract VcoinGenesisCoordinator {
    author: "V COIN"
    version: "1.0.0"
    description: "Stateless fixed-slot VCOIN genesis dispatcher"
    incomingMessages: StartVcoinGenesis
    storage: cell
}

fun sendVcoinGenesisSlotRequest(masterAddress: address, slotId: uint8) {
    val request = createMessage({
        bounce: BounceMode.Only256BitsOfBody,
        dest: masterAddress,
        value: VCOIN_GENESIS_REQUEST_TON_VALUE,
        body: VcoinGenesisSlotRequest { slotId },
    });
    request.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy StartVcoinGenesis.fromSlice(in.body);
    assert (in.valueCoins >= VCOIN_GENESIS_COORDINATOR_MIN_CALL_VALUE) throw ERROR_NOT_ENOUGH_GAS;

    sendVcoinGenesisSlotRequest(msg.masterAddress, 1);
    sendVcoinGenesisSlotRequest(msg.masterAddress, 2);
    sendVcoinGenesisSlotRequest(msg.masterAddress, 3);
    sendVcoinGenesisSlotRequest(msg.masterAddress, 4);
    sendVcoinGenesisSlotRequest(msg.masterAddress, 5);
}

fun onBouncedMessage(_in: InMessageBounced) {
    // The coordinator is stateless. A bounced slot request is safely retried
    // by submitting StartVcoinGenesis again; the Master handles slot replay.
}
