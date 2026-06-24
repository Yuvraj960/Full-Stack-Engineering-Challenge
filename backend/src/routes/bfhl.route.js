'use strict';

/**
 * routes/bfhl.route.js
 *
 * Declares all routes for the /bfhl prefix.
 * Routing only — no business logic here.
 */
const { Router }      = require('express');
const bfhlController  = require('../controllers/bfhl.controller');

const router = Router();

// POST /bfhl
router.post('/', bfhlController.handlePost);

module.exports = router;
