import "../../src/messages";

contract BounceRejector {
    receive(msg: TokenTransferInternal) {
        require(false, "Intentional test-only wallet-credit rejection");
    }
}
