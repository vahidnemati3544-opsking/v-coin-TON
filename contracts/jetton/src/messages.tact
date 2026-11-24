struct JettonData { total_supply: Int; mintable: Bool; owner: Address; content: Cell; wallet_code: Cell; }
struct JettonWalletData { balance: Int; owner: Address; master: Address; code: Cell; }
struct VCoinReceiptStatus {
    next_receipt_stage: Int;
    receipt_pending: Bool;
    pending_receipt_amount: Int;
    stage_1_confirmed: Bool;
    stage_2_confirmed: Bool;
    stage_3_confirmed: Bool;
    stage_4_confirmed: Bool;
    stage_5_confirmed: Bool;
    remaining_supply: Int;
}
message(0xf8a7ea5) TokenTransfer {
    query_id: Int as uint64; amount: Int as coins; destination: Address;
    response_destination: Address?; custom_payload: Cell?;
    forward_ton_amount: Int as coins; forward_payload: Slice as remaining;
}
message(0x178d4519) TokenTransferInternal {
    query_id: Int as uint64; amount: Int as coins; from: Address;
    response_destination: Address?; forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}
message(0x7362d09c) TokenNotification {
    query_id: Int as uint64; amount: Int as coins; from: Address;
    forward_payload: Slice as remaining;
}
message(0x595f07bc) TokenBurn {
    query_id: Int as uint64; amount: Int as coins;
    response_destination: Address?; custom_payload: Cell?;
}
message(0x7bdd97de) TokenBurnNotification {
    query_id: Int as uint64; amount: Int as coins; sender: Address;
    response_destination: Address?;
}
message(0x6f8a2d41) VCoinReceiptAcknowledgement { query_id: Int as uint64; amount: Int as coins; }
message VCoinRetryReceiptAcknowledgement {}
message(0xd53276db) TokenExcesses { query_id: Int as uint64; }
message(0x2c76b973) ProvideWalletAddress {
    query_id: Int as uint64; owner_address: Address; include_address: Bool;
}
message(0xd1735400) TakeWalletAddress {
    query_id: Int as uint64; wallet_address: Address; owner_address: Slice as remaining;
}
