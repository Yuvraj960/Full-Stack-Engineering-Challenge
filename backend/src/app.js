'use strict';

/**
 * app.js — Express application factory
 * Configures middleware, mounts routes, and exports the app instance.
 * The HTTP server is started separately in server.js.
 */
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const bfhlRouter = require('./routes/bfhl.route');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Explicitly allow ALL origins, methods, and headers.
// This is required by the evaluator who calls the API from a different origin.
const corsOptions = {
  origin: '*',                                          // allow any origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200,                            // some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Handle every preflight OPTIONS request globally so the evaluator's
// browser pre-flight check always gets a 200 with the right headers.
app.options('*', cors(corsOptions));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/bfhl', bfhlRouter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status:   'ok',
    message:  'BFHL API is running ✔',
    endpoint: 'POST /bfhl',
    cors:     'enabled — all origins accepted',
  });
});

// ── 404 Fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
