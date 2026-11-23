'use strict';

const express = require('express');
const { TonProofError, createTonProofService } = require('../services/ton-proof');

function createTonProofRouter({ pool, expectedDomain }) {
  const router = express.Router();
  const service = createTonProofService({ pool, expectedDomain });

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
