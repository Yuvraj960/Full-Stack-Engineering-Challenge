'use strict';

/**
 * server.js — Entry point
 * Starts the HTTP server. All app logic lives in src/.
 */
const app  = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀  BFHL API  →  http://localhost:${PORT}`);
  console.log(`    POST /bfhl  ·  Content-Type: application/json\n`);
});
