import "@acton/emulation/scripts"
import "utils/common"

fun main() {
    val deployer = promptJettonWallet("JETTON_DEPLOYER", "Select Jetton Deployer");
    val admin = promptJettonAddress(
        "JETTON_ADMIN_ADDRESS",
        "Enter admin address",
        deployer.address,
    );
    val storage = promptVcoinMinterStorage(admin);

    val minter = deployVcoinMinter(deployer, storage);

    printVcoinMinterInfo(minter, "JETTON");
    printJettonWalletInfo(minter, admin, "JETTON_ADMIN");
}
