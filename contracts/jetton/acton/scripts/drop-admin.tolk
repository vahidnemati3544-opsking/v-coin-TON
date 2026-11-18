import "utils/common"
import "../wrappers/utils"

fun main() {
    val admin = promptJettonWallet("JETTON_ADMIN", "Select VCOIN Testnet admin wallet");
    val minter = promptVcoinMinter("Enter VCOIN Jetton Master address");
    val result = minter.sendDropAdmin(admin.address);
    result.waitForFirstTransaction();
    printVcoinMinterInfo(minter, "VCOIN_AFTER_ADMIN_LOCK");
    printJettonWalletInfo(minter, admin.address, "VCOIN_ADMIN_WALLET");
}
