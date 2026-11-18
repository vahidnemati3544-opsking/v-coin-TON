import "utils/common"
import "../wrappers/utils"

fun main() {
    val admin = promptJettonWallet("JETTON_ADMIN", "Select VCOIN Testnet admin wallet");
    val minter = promptJettonMinter("Enter VCOIN Jetton Master address");
    val result = minter.sendDropAdmin(admin.address);
    result.waitForFirstTransaction();
    printJettonMinterInfo(minter, "VCOIN_AFTER_ADMIN_LOCK");
    printJettonWalletInfo(minter, admin.address, "VCOIN_ADMIN_WALLET");
}
