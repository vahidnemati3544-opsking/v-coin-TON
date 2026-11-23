'use strict';

const express = require('express');
const { TonProofError, createTonProofService } = require('../services/ton-proof');
const { createTonRpcProvider, NETWORKS } = require('../services/ton-rpc-provider');
const { createWalletSnapshotService } = require('../services/wallet-snapshot');

function createTonProofRouter({
  pool,
  expectedDomain,
  jettonMasterAddress,
  mainnetJettonMasterAddress,
  testnetJettonMasterAddress,
  mainnetRpcEndpoint,
  testnetRpcEndpoint,
  rpcApiKey
}) {
  const router = express.Router();
  const service = createTonProofService({ pool, expectedDomain });
  const masterForNetwork = (network) => {
    if (network === 'mainnet') return mainnetJettonMasterAddress || jettonMasterAddress;
    if (network === 'testnet') return testnetJettonMasterAddress;
    return null;
  };
  const snapshotService = createWalletSnapshotService({
    pool,
    jettonMasterAddress: masterForNetwork,
    providerFactory(network) {
      const selectedMaster = masterForNetwork(network);
      return createTonRpcProvider({
        network,
        jettonMasterAddress: selectedMaster,
        endpoint: network === 'mainnet'
          ? (mainnetRpcEndpoint || NETWORKS.mainnet.defaultEndpoint)
          : (testnetRpcEndpoint || NETWORKS.testnet.defaultEndpoint),
        apiKey: rpcApiKey
      });
    }
  });

  router.post('/payload', async (req, res, next) => {
    try {
      const network = req.body?.network === '-3' ? 'testnet' :
        req.body?.network === '-239' ? 'mainnet' : null;
      if (!network) return res.status(400).json({ error: 'UNSUPPORTED_TON_NETWORK' });
      const challenge = await service.createChallenge({
        userId: req.auth.user_id,
        sessionId: req.auth.session_id,
        network
      });
      return res.status(201).json(challenge);
    } catch (error) {
      return next(error);
    }
  });


  router.post('/snapshot', async (req, res, next) => {
    try {
      const network = req.body?.network === '-3' ? 'testnet' :
        req.body?.network === '-239' ? 'mainnet' : null;
      if (!network) return res.status(400).json({ error: 'UNSUPPORTED_TON_NETWORK' });
      const snapshot = await snapshotService.capture({
        userId: req.auth.user_id,
        network
      });
      return res.status(200).json({
        snapshot_id: snapshot.snapshotId,
        network: snapshot.network,
        owner_wallet_address: snapshot.ownerWalletAddress,
        jetton_master_address: snapshot.jettonMasterAddress,
        jetton_wallet_address: snapshot.jettonWalletAddress,
        balance_base_units: snapshot.balanceBaseUnits,
        chain_block_seqno: snapshot.blockSeqno,
        observed_at: snapshot.observedAt,
        is_final: snapshot.isFinal
      });
    } catch (error) {
      if (error && error.code) {
        const status = error.code === 'VERIFIED_WALLET_NOT_FOUND' ? 409 :
          error.code === 'INVALID_NETWORK' ? 400 :
          error.code === 'JETTON_MASTER_NOT_CONFIGURED' ||
          error.code === 'TON_RPC_NOT_CONFIGURED' ? 503 : 503;
        return res.status(status).json({ error: error.code });
      }
      return next(error);
    }
  });

  router.post('/verify', async (req, res, next) => {
    try {
      const result = await service.verifyAndBind({
        userId: req.auth.user_id,
        sessionId: req.auth.session_id,
        input: req.body
      });
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof TonProofError) {
        const status = error.code === 'TON_PROOF_NOT_CONFIGURED' ? 503 :
          error.code === 'WALLET_ALREADY_BOUND' ? 409 : 401;
        return res.status(status).json({ error: error.code });
      }
      return next(error);
    }
  });

  return router;
}

module.exports = { createTonProofRouter };
