'use strict';

/**
 * controllers/bfhl.controller.js
 *
 * Handles HTTP request/response for the /bfhl endpoint.
 * Validates the request shape, delegates to the service layer,
 * and formats the HTTP response. No business logic here.
 */
const bfhlService = require('../services/bfhl.service');

/**
 * POST /bfhl
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.handlePost = (req, res) => {
  try {
    const { data } = req.body;

    // ── Input shape guard ──────────────────────────────────────────────────────
    if (!Array.isArray(data)) {
      return res.status(400).json({
        error:   'Bad Request',
        message: '"data" must be an array of strings.',
      });
    }

    // ── Delegate to service ────────────────────────────────────────────────────
    const result = bfhlService.process(data);
    return res.status(200).json(result);

  } catch (err) {
    console.error('[bfhl.controller] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
