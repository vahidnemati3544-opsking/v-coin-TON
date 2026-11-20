import "@gen/VcoinJettonWallet.code"
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
    | TopUpTons

fun vcoinAllocationId(storage: VcoinMinterStorage, recipient: address): int {
    if (recipient == VCOIN_FOUNDER_OWNER) {
        return VCOIN_ALLOCATION_FOUNDER;
    }
    if (recipient == VCOIN_MINING_OWNER) {
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

    var matchedAllocation = VCOIN_ALLOCATION_NONE;
    var matchedOwner: address? = null;

    if (
        storage.pendingAllocation == VCOIN_ALLOCATION_FOUNDER &&
        storage.pendingQueryId == msg.queryId &&
        storage.founderStatus == VCOIN_MINT_PENDING &&
        msg.jettonAmount == VCOIN_FOUNDER_CAP
    ) {
        matchedAllocation = VCOIN_ALLOCATION_FOUNDER;
        matchedOwner = VCOIN_FOUNDER_OWNER;
    } else if (
        storage.pendingAllocation == VCOIN_ALLOCATION_MINING &&
        storage.pendingQueryId == msg.queryId &&
        storage.miningStatus == VCOIN_MINT_PENDING &&
        msg.jettonAmount == VCOIN_MINING_CAP
    ) {
        matchedAllocation = VCOIN_ALLOCATION_MINING;
        matchedOwner = VCOIN_MINING_OWNER;
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

            val allocationId = vcoinAllocationId(storage, msg.mintRecipient);
            assert (allocationId != VCOIN_ALLOCATION_NONE) throw ERROR_INVALID_OP;
            // Founder and mining allocations must remain blocked until their
            // audited vesting escrows are implemented and wired into mint routing.
            assert (
                allocationId != VCOIN_ALLOCATION_FOUNDER && allocationId != VCOIN_ALLOCATION_MINING
            ) throw ERROR_INVALID_OP;
            val cap = vcoinAllocationCap(allocationId);
            assert (internalTransferMsg.jettonAmount == cap) throw ERROR_INVALID_OP;
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
    return [
        storage.totalSupply,
        storage.lifetimeIssued,
        storage.founderStatus,
        storage.miningStatus,
        storage.treasuryStatus,
        storage.liquidityStatus,
        storage.ecosystemStatus,
        storage.finalized,
    ];
}
