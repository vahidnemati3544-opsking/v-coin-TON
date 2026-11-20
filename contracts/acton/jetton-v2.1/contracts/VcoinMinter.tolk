import "@gen/VcoinJettonWallet.code"
import "@gen/VcoinVestingEscrow.code"
import "errors"
import "fees-management"
import "jetton-utils"
import "messages"
import "sharding"
import "storage"
import "vcoin-messages"
import "vcoin-storage"

const VCOIN_MAX_SUPPLY = 10000000000000000
const VCOIN_FOUNDER_CAP = 2000000000000000
const VCOIN_MINING_CAP = 5000000000000000
const VCOIN_TREASURY_CAP = 1000000000000000
const VCOIN_LIQUIDITY_CAP = 1000000000000000
const VCOIN_ECOSYSTEM_CAP = 1000000000000000

const VCOIN_FOUNDER_OWNER = address("UQAdW09EvIesUXt9jzLq1T32O0351TaczwWJQLGGmw4aWrzy")
const VCOIN_MINING_OWNER = address("UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0")
const VCOIN_LIQUIDITY_OWNER = address("UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn")
const VCOIN_ECOSYSTEM_OWNER = address("UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE")

const VCOIN_ALLOCATION_NONE = 0
const VCOIN_ALLOCATION_FOUNDER = 1
const VCOIN_ALLOCATION_MINING = 2
const VCOIN_ALLOCATION_TREASURY = 3
const VCOIN_ALLOCATION_LIQUIDITY = 4
const VCOIN_ALLOCATION_ECOSYSTEM = 5

const VCOIN_MINT_NOT_ISSUED = 0
const VCOIN_MINT_PENDING = 1
const VCOIN_MINT_CONFIRMED = 2

contract VcoinMinter {
    author: "V COIN"
    version: "1.0.0"
    description: "V COIN fixed-allocation TON Jetton minter"
    incomingMessages: AllowedVcoinMinterMessage
    storage: VcoinMinterStorage
}

type AllowedVcoinMinterMessage =
    | MintNewJettons
    | BurnNotificationForMinter
    | RequestWalletAddress
    | ChangeMinterMetadata
    | DropMinterAdmin
    | VcoinMintAccepted
    | ConfigureVcoinEscrows
    | VcoinVestingEscrowReady
    | VcoinEscrowDepositAccepted
    | TopUpTons


fun calcVcoinVestingEscrowDeployment(
    vestingKind: uint8,
    startTime: uint32,
    queryId: uint64,
): AutoDeployAddress {
    var beneficiaryAddress = VCOIN_FOUNDER_OWNER;
    if (vestingKind == 2) {
        beneficiaryAddress = VCOIN_MINING_OWNER;
    }
    val escrowStorage: VcoinVestingEscrowStorage = {
        vestingKind,
        minterAddress: contract.getAddress(),
        startTime,
        configQueryId: queryId,
        deposited: false,
        releasedAmount: 0,
        pendingReleaseAmount: 0,
        pendingReleaseQueryId: 0,
    };
    return {
        workchain: MY_WORKCHAIN,
        stateInit: {
            code: vcoinVestingEscrowCompiledCode(),
            data: escrowStorage.toCell(),
        },
        toShard: { fixedPrefixLength: SHARD_DEPTH, closeTo: beneficiaryAddress },
    };
}

fun vcoinAllocationId(storage: VcoinMinterStorage, recipient: address): int {
    val escrowState = VcoinMinterEscrowState.fromCell(storage.escrowState);
    if (escrowState.founderEscrowOwner != null && recipient == escrowState.founderEscrowOwner!) {
        return VCOIN_ALLOCATION_FOUNDER;
    }
    if (escrowState.miningEscrowOwner != null && recipient == escrowState.miningEscrowOwner!) {
        return VCOIN_ALLOCATION_MINING;
    }
    if (recipient == storage.treasuryOwner) {
        return VCOIN_ALLOCATION_TREASURY;
    }
    if (recipient == VCOIN_LIQUIDITY_OWNER) {
        return VCOIN_ALLOCATION_LIQUIDITY;
    }
    if (recipient == VCOIN_ECOSYSTEM_OWNER) {
        return VCOIN_ALLOCATION_ECOSYSTEM;
    }
    return VCOIN_ALLOCATION_NONE;
}

fun vcoinAllocationCap(allocationId: int): coins {
    if (allocationId == VCOIN_ALLOCATION_FOUNDER) {
        return VCOIN_FOUNDER_CAP;
    }
    if (allocationId == VCOIN_ALLOCATION_MINING) {
        return VCOIN_MINING_CAP;
    }
    if (allocationId == VCOIN_ALLOCATION_TREASURY) {
        return VCOIN_TREASURY_CAP;
    }
    if (allocationId == VCOIN_ALLOCATION_LIQUIDITY) {
        return VCOIN_LIQUIDITY_CAP;
    }
    if (allocationId == VCOIN_ALLOCATION_ECOSYSTEM) {
        return VCOIN_ECOSYSTEM_CAP;
    }
    return 0;
}

fun vcoinStatus(storage: VcoinMinterStorage, allocationId: int): uint8 {
    if (allocationId == VCOIN_ALLOCATION_FOUNDER) {
        return storage.founderStatus;
    }
    if (allocationId == VCOIN_ALLOCATION_MINING) {
        return storage.miningStatus;
    }
    if (allocationId == VCOIN_ALLOCATION_TREASURY) {
        return storage.treasuryStatus;
    }
    if (allocationId == VCOIN_ALLOCATION_LIQUIDITY) {
        return storage.liquidityStatus;
    }
    if (allocationId == VCOIN_ALLOCATION_ECOSYSTEM) {
        return storage.ecosystemStatus;
    }
    return VCOIN_MINT_NOT_ISSUED;
}

fun setVcoinPending(mutate storage: VcoinMinterStorage, allocationId: int, queryId: uint64) {
    storage.pendingAllocation = allocationId;
    storage.pendingQueryId = queryId;
    if (allocationId == VCOIN_ALLOCATION_FOUNDER) {
        storage.founderStatus = VCOIN_MINT_PENDING;
    } else if (allocationId == VCOIN_ALLOCATION_MINING) {
        storage.miningStatus = VCOIN_MINT_PENDING;
    } else if (allocationId == VCOIN_ALLOCATION_TREASURY) {
        storage.treasuryStatus = VCOIN_MINT_PENDING;
    } else if (allocationId == VCOIN_ALLOCATION_LIQUIDITY) {
        storage.liquidityStatus = VCOIN_MINT_PENDING;
    } else if (allocationId == VCOIN_ALLOCATION_ECOSYSTEM) {
        storage.ecosystemStatus = VCOIN_MINT_PENDING;
    } else {
        throw ERROR_INVALID_OP;
    }
}

fun setVcoinConfirmed(mutate storage: VcoinMinterStorage, allocationId: int) {
    storage.pendingAllocation = VCOIN_ALLOCATION_NONE;
    storage.pendingQueryId = 0;
    if (allocationId == VCOIN_ALLOCATION_FOUNDER) {
        storage.founderStatus = VCOIN_MINT_CONFIRMED;
    } else if (allocationId == VCOIN_ALLOCATION_MINING) {
        storage.miningStatus = VCOIN_MINT_CONFIRMED;
    } else if (allocationId == VCOIN_ALLOCATION_TREASURY) {
        storage.treasuryStatus = VCOIN_MINT_CONFIRMED;
    } else if (allocationId == VCOIN_ALLOCATION_LIQUIDITY) {
        storage.liquidityStatus = VCOIN_MINT_CONFIRMED;
    } else if (allocationId == VCOIN_ALLOCATION_ECOSYSTEM) {
        storage.ecosystemStatus = VCOIN_MINT_CONFIRMED;
    } else {
        throw ERROR_INVALID_OP;
    }
}

fun setVcoinRolledBack(mutate storage: VcoinMinterStorage, allocationId: int, amount: coins) {
    storage.pendingAllocation = VCOIN_ALLOCATION_NONE;
    storage.pendingQueryId = 0;
    if (allocationId == VCOIN_ALLOCATION_FOUNDER) {
        storage.founderStatus = VCOIN_MINT_NOT_ISSUED;
    } else if (allocationId == VCOIN_ALLOCATION_MINING) {
        storage.miningStatus = VCOIN_MINT_NOT_ISSUED;
    } else if (allocationId == VCOIN_ALLOCATION_TREASURY) {
        storage.treasuryStatus = VCOIN_MINT_NOT_ISSUED;
    } else if (allocationId == VCOIN_ALLOCATION_LIQUIDITY) {
        storage.liquidityStatus = VCOIN_MINT_NOT_ISSUED;
    } else if (allocationId == VCOIN_ALLOCATION_ECOSYSTEM) {
        storage.ecosystemStatus = VCOIN_MINT_NOT_ISSUED;
    } else {
        throw ERROR_INVALID_OP;
    }
}

fun vcoinAllAllocationsConfirmed(storage: VcoinMinterStorage): bool {
    return storage.founderStatus == VCOIN_MINT_CONFIRMED &&
        storage.miningStatus == VCOIN_MINT_CONFIRMED &&
        storage.treasuryStatus == VCOIN_MINT_CONFIRMED &&
        storage.liquidityStatus == VCOIN_MINT_CONFIRMED &&
        storage.ecosystemStatus == VCOIN_MINT_CONFIRMED &&
        storage.lifetimeIssued == VCOIN_MAX_SUPPLY;
}

fun onBouncedMessage(in: InMessageBounced) {
    in.bouncedBody.skipBouncedPrefix();
    val msg = lazy InternalTransferStep.fromSlice(in.bouncedBody);
    var storage = lazy VcoinMinterStorage.load();
    val escrowState = VcoinMinterEscrowState.fromCell(storage.escrowState);

    var matchedAllocation = VCOIN_ALLOCATION_NONE;
    var matchedOwner: address? = null;

    if (
        storage.pendingAllocation == VCOIN_ALLOCATION_FOUNDER &&
        storage.pendingQueryId == msg.queryId &&
        escrowState.founderEscrowOwner != null &&
        storage.founderStatus == VCOIN_MINT_PENDING &&
        msg.jettonAmount == VCOIN_FOUNDER_CAP
    ) {
        matchedAllocation = VCOIN_ALLOCATION_FOUNDER;
        matchedOwner = storage.founderEscrowOwner;
    } else if (
        storage.pendingAllocation == VCOIN_ALLOCATION_MINING &&
        storage.pendingQueryId == msg.queryId &&
        escrowState.miningEscrowOwner != null &&
        storage.miningStatus == VCOIN_MINT_PENDING &&
        msg.jettonAmount == VCOIN_MINING_CAP
    ) {
        matchedAllocation = VCOIN_ALLOCATION_MINING;
        matchedOwner = storage.miningEscrowOwner;
    } else if (
        storage.pendingAllocation == VCOIN_ALLOCATION_TREASURY &&
        storage.pendingQueryId == msg.queryId &&
        storage.treasuryStatus == VCOIN_MINT_PENDING &&
        msg.jettonAmount == VCOIN_TREASURY_CAP
    ) {
        matchedAllocation = VCOIN_ALLOCATION_TREASURY;
        matchedOwner = storage.treasuryOwner;
    } else if (
        storage.pendingAllocation == VCOIN_ALLOCATION_LIQUIDITY &&
        storage.pendingQueryId == msg.queryId &&
        storage.liquidityStatus == VCOIN_MINT_PENDING &&
        msg.jettonAmount == VCOIN_LIQUIDITY_CAP
    ) {
        matchedAllocation = VCOIN_ALLOCATION_LIQUIDITY;
        matchedOwner = VCOIN_LIQUIDITY_OWNER;
    } else if (
        storage.pendingAllocation == VCOIN_ALLOCATION_ECOSYSTEM &&
        storage.pendingQueryId == msg.queryId &&
        storage.ecosystemStatus == VCOIN_MINT_PENDING &&
        msg.jettonAmount == VCOIN_ECOSYSTEM_CAP
    ) {
        matchedAllocation = VCOIN_ALLOCATION_ECOSYSTEM;
        matchedOwner = VCOIN_ECOSYSTEM_OWNER;
    }

    if (matchedAllocation == VCOIN_ALLOCATION_NONE || matchedOwner == null) {
        return;
    }

    val expectedWallet = calcAddressOfJettonWallet(
        matchedOwner!,
        contract.getAddress(),
        vcoinJettonWalletCompiledCode(),
    );
    if (in.senderAddress != expectedWallet) {
        return;
    }

    storage.totalSupply -= msg.jettonAmount;
    setVcoinRolledBack(mutate storage, matchedAllocation, msg.jettonAmount);
    storage.save();
}

fun onInternalMessage(in: InMessage) {
    if (in.body.isEmpty()) {
        return;
    }
    val msg = lazy AllowedVcoinMinterMessage.fromSlice(in.body);

    match (msg) {
        MintNewJettons => {
            var storage = lazy VcoinMinterStorage.load();
            assert (
                storage.adminAddress != null && in.senderAddress == storage.adminAddress!
            ) throw ERROR_NOT_OWNER;
            assert (!storage.finalized) throw ERROR_NOT_OWNER;
            assert (msg.mintRecipient.getWorkchain() == MY_WORKCHAIN) throw ERROR_WRONG_WORKCHAIN;

            val internalTransferMsg = lazy msg
                .internalTransferMsg
                .load({
                    throwIfOpcodeDoesNotMatch: ERROR_INVALID_OP,
                });
            assert (internalTransferMsg.transferInitiator == null) throw ERROR_INVALID_OP;
            assert (internalTransferMsg.jettonAmount > 0) throw ERROR_INVALID_OP;
            assert (msg.queryId != 0) throw ERROR_INVALID_OP;
            assert (storage.pendingAllocation == VCOIN_ALLOCATION_NONE) throw ERROR_INVALID_OP;
            internalTransferMsg.forwardPayload.checkIsCorrectTlbEither();

            assert (storage.founderEscrowOwner != null) throw ERROR_INVALID_OP;
            assert (storage.miningEscrowOwner != null) throw ERROR_INVALID_OP;
            assert (escrowState.founderEscrowReady && escrowState.miningEscrowReady) throw ERROR_INVALID_OP;
            val allocationId = vcoinAllocationId(storage, msg.mintRecipient);
            assert (allocationId != VCOIN_ALLOCATION_NONE) throw ERROR_INVALID_OP;
            val cap = vcoinAllocationCap(allocationId);
            assert (internalTransferMsg.jettonAmount == cap) throw ERROR_INVALID_OP;
            if (
                allocationId == VCOIN_ALLOCATION_FOUNDER ||
                allocationId == VCOIN_ALLOCATION_MINING
            ) {
                assert (internalTransferMsg.forwardTonAmount > 0) throw ERROR_INVALID_OP;
            }
            assert (
                vcoinStatus(storage, allocationId) == VCOIN_MINT_NOT_ISSUED
            ) throw ERROR_INVALID_OP;
            assert (
                storage.lifetimeIssued + internalTransferMsg.jettonAmount <= VCOIN_MAX_SUPPLY
            ) throw ERROR_INVALID_OP;

            checkAmountIsEnoughToTransfer(
                msg.tonAmount,
                internalTransferMsg.forwardTonAmount,
                in.originalForwardFee,
            );

            setVcoinPending(mutate storage, allocationId, msg.queryId);
            storage.totalSupply += internalTransferMsg.jettonAmount;
            storage.save();

            reserveGramsOnBalance(grams("0.01"), RESERVE_MODE_EXACT_AMOUNT);
            val deployMsg = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: calcDeployedJettonWallet(
                    msg.mintRecipient,
                    contract.getAddress(),
                    vcoinJettonWalletCompiledCode(),
                ),
                value: msg.tonAmount,
                body: msg.internalTransferMsg,
            });
            deployMsg.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        ConfigureVcoinEscrows => {
            var storage = lazy VcoinMinterStorage.load();
            var escrowState = VcoinMinterEscrowState.fromCell(storage.escrowState);
            assert (
                storage.adminAddress != null && in.senderAddress == storage.adminAddress!
            ) throw ERROR_NOT_OWNER;
            assert (!storage.finalized) throw ERROR_NOT_OWNER;
            assert (storage.pendingAllocation == VCOIN_ALLOCATION_NONE) throw ERROR_INVALID_OP;
            assert (storage.founderStatus == VCOIN_MINT_NOT_ISSUED) throw ERROR_INVALID_OP;
            assert (storage.miningStatus == VCOIN_MINT_NOT_ISSUED) throw ERROR_INVALID_OP;
            assert (storage.founderEscrowOwner == null) throw ERROR_INVALID_OP;
            assert (storage.miningEscrowOwner == null) throw ERROR_INVALID_OP;
            assert (msg.queryId != 0) throw ERROR_INVALID_OP;
            assert (msg.startTime >= blockchain.now()) throw ERROR_INVALID_OP;
            assert (in.valueCoins >= grams("1.2")) throw ERROR_NOT_ENOUGH_GAS;

            val founderEscrowInit = calcVcoinVestingEscrowDeployment(1, msg.startTime, msg.queryId);
            val miningEscrowInit = calcVcoinVestingEscrowDeployment(2, msg.startTime, msg.queryId);
            storage.founderEscrowOwner = founderEscrowInit.calculateAddress();
            storage.miningEscrowOwner = miningEscrowInit.calculateAddress();
            storage.founderEscrowReady = false;
            storage.miningEscrowReady = false;
            storage.escrowConfigQueryId = msg.queryId;
            storage.escrowState = escrowState.toCell();
            storage.save();

            val deployFounder = createMessage({
                bounce: BounceMode.NoBounce,
                dest: founderEscrowInit,
                value: grams("0.5"),
                body: TopUpTons {},
            });
            deployFounder.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);

            val deployMining = createMessage({
                bounce: BounceMode.NoBounce,
                dest: miningEscrowInit,
                value: grams("0.5"),
                body: TopUpTons {},
            });
            deployMining.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        VcoinVestingEscrowReady => {
            var storage = lazy VcoinMinterStorage.load();
            var escrowState = VcoinMinterEscrowState.fromCell(storage.escrowState);
            assert (msg.queryId == storage.escrowConfigQueryId) throw ERROR_INVALID_OP;
            assert (msg.escrowAddress == in.senderAddress) throw ERROR_INVALID_OP;
            if (msg.vestingKind == 1) {
                assert (storage.founderEscrowOwner != null) throw ERROR_INVALID_OP;
                assert (in.senderAddress == storage.founderEscrowOwner!) throw ERROR_NOT_VALID_WALLET;
                assert (!storage.founderEscrowReady) throw ERROR_INVALID_OP;
                storage.founderEscrowReady = true;
            } else if (msg.vestingKind == 2) {
                assert (storage.miningEscrowOwner != null) throw ERROR_INVALID_OP;
                assert (in.senderAddress == storage.miningEscrowOwner!) throw ERROR_NOT_VALID_WALLET;
                assert (!storage.miningEscrowReady) throw ERROR_INVALID_OP;
                storage.miningEscrowReady = true;
            } else {
                throw ERROR_INVALID_OP;
            }
            storage.escrowState = escrowState.toCell();
            storage.save();
        }

        VcoinEscrowDepositAccepted => {
            var storage = lazy VcoinMinterStorage.load();
            val escrowState = VcoinMinterEscrowState.fromCell(storage.escrowState);
            assert (msg.queryId == storage.pendingQueryId) throw ERROR_INVALID_OP;
            assert (msg.escrowAddress == in.senderAddress) throw ERROR_INVALID_OP;
            var allocationId = VCOIN_ALLOCATION_NONE;
            if (msg.vestingKind == 1) {
                assert (storage.founderEscrowOwner != null) throw ERROR_INVALID_OP;
                assert (in.senderAddress == storage.founderEscrowOwner!) throw ERROR_NOT_VALID_WALLET;
                allocationId = VCOIN_ALLOCATION_FOUNDER;
            } else if (msg.vestingKind == 2) {
                assert (storage.miningEscrowOwner != null) throw ERROR_INVALID_OP;
                assert (in.senderAddress == storage.miningEscrowOwner!) throw ERROR_NOT_VALID_WALLET;
                allocationId = VCOIN_ALLOCATION_MINING;
            } else {
                throw ERROR_INVALID_OP;
            }
            assert (storage.pendingAllocation == allocationId) throw ERROR_INVALID_OP;
            assert (msg.jettonAmount == vcoinAllocationCap(allocationId)) throw ERROR_INVALID_OP;
            assert (vcoinStatus(storage, allocationId) == VCOIN_MINT_PENDING) throw ERROR_INVALID_OP;
            setVcoinConfirmed(mutate storage, allocationId);
            storage.lifetimeIssued += msg.jettonAmount;
            storage.save();
        }

        VcoinMintAccepted => {
            var storage = lazy VcoinMinterStorage.load();
            val allocationId = vcoinAllocationId(storage, msg.ownerAddress);
            assert (allocationId != VCOIN_ALLOCATION_NONE) throw ERROR_INVALID_OP;
            assert (msg.jettonAmount == vcoinAllocationCap(allocationId)) throw ERROR_INVALID_OP;
            assert (msg.queryId == storage.pendingQueryId) throw ERROR_INVALID_OP;
            assert (
                vcoinStatus(storage, allocationId) == VCOIN_MINT_PENDING
            ) throw ERROR_INVALID_OP;
            assert (
                in.senderAddress ==
                calcAddressOfJettonWallet(
                    msg.ownerAddress,
                    contract.getAddress(),
                    vcoinJettonWalletCompiledCode(),
                )
            ) throw ERROR_NOT_VALID_WALLET;
            if (
                allocationId == VCOIN_ALLOCATION_FOUNDER ||
                allocationId == VCOIN_ALLOCATION_MINING
            ) {
                return;
            }
            setVcoinConfirmed(mutate storage, allocationId);
            storage.lifetimeIssued += msg.jettonAmount;
            storage.save();
        }

        BurnNotificationForMinter => {
            var storage = lazy VcoinMinterStorage.load();
            val jettonWalletCode = vcoinJettonWalletCompiledCode();
            assert (
                in.senderAddress ==
                calcAddressOfJettonWallet(
                    msg.burnInitiator,
                    contract.getAddress(),
                    jettonWalletCode,
                )
            ) throw ERROR_NOT_VALID_WALLET;
            assert (storage.totalSupply >= msg.jettonAmount) throw ERROR_INVALID_OP;
            storage.totalSupply -= msg.jettonAmount;
            storage.save();

            if (msg.sendExcessesTo == null) {
                return;
            }
            val excessesMsg = createMessage({
                bounce: BounceMode.NoBounce,
                dest: msg.sendExcessesTo,
                value: 0,
                body: ReturnExcessesBack { queryId: msg.queryId },
            });
            excessesMsg.send(SEND_MODE_IGNORE_ERRORS | SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE);
        }

        RequestWalletAddress => {
            val ownerAddress: Cell<address>? = msg.includeOwnerAddress
                ? msg.ownerAddress.toCell()
                : null;
            var walletAddress: address? = null;
            if (msg.ownerAddress.getWorkchain() == MY_WORKCHAIN) {
                walletAddress = calcAddressOfJettonWallet(
                    msg.ownerAddress,
                    contract.getAddress(),
                    vcoinJettonWalletCompiledCode(),
                );
            }
            val respondMsg = createMessage({
                bounce: BounceMode.NoBounce,
                dest: in.senderAddress,
                value: 0,
                body: ResponseWalletAddress {
                    queryId: msg.queryId,
                    jettonWalletAddress: walletAddress,
                    ownerAddress,
                },
            });
            respondMsg.send(
                SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE | SEND_MODE_BOUNCE_ON_ACTION_FAIL,
            );
        }

        ChangeMinterMetadata => {
            var storage = lazy VcoinMinterStorage.load();
            assert (
                storage.adminAddress != null && in.senderAddress == storage.adminAddress!
            ) throw ERROR_NOT_OWNER;
            assert (!storage.finalized) throw ERROR_NOT_OWNER;
            storage.metadata = msg.newMetadata;
            storage.save();
        }

        DropMinterAdmin => {
            var storage = lazy VcoinMinterStorage.load();
            assert (
                storage.adminAddress != null && in.senderAddress == storage.adminAddress!
            ) throw ERROR_NOT_OWNER;
            assert (!storage.finalized) throw ERROR_NOT_OWNER;
            assert (vcoinAllAllocationsConfirmed(storage)) throw ERROR_INVALID_OP;
            storage.finalized = true;
            storage.adminAddress = null;
            storage.save();
        }

        TopUpTons => {}

        else => throw 0xFFFF,
    }
}

get fun get_jetton_data(): JettonDataReply {
    val storage = lazy VcoinMinterStorage.load();
    return {
        totalSupply: storage.totalSupply,
        mintable: storage.adminAddress != null && !storage.finalized,
        adminAddress: storage.adminAddress,
        jettonContent: storage.metadata as Cell<OnchainMetadataReply>,
        jettonWalletCode: vcoinJettonWalletCompiledCode(),
    };
}

get fun get_wallet_address(ownerAddress: address): address {
    return calcAddressOfJettonWallet(
        ownerAddress,
        contract.getAddress(),
        vcoinJettonWalletCompiledCode(),
    );
}

get fun get_vcoin_issuance_state(): tuple {
    val storage = lazy VcoinMinterStorage.load();
    val escrowState = VcoinMinterEscrowState.fromCell(storage.escrowState);
    return [
        storage.totalSupply,
        storage.lifetimeIssued,
        storage.founderStatus,
        storage.miningStatus,
        storage.treasuryStatus,
        storage.liquidityStatus,
        storage.ecosystemStatus,
        storage.finalized,
        storage.founderEscrowOwner,
        storage.miningEscrowOwner,
    ];
}
