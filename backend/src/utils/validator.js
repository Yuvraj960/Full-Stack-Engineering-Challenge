'use strict';

/**
 * utils/validator.js
 *
 * Validates and deduplicates the raw input array.
 *
 * Validation rules (applied in order):
 *   1. Convert to string and trim whitespace
 *   2. Must match pattern  ^([A-Z])->([A-Z])$  (single uppercase letter each side)
 *   3. Self-loops (A->A) are invalid
 *   4. First occurrence of a pair → validEdges
 *   5. Subsequent occurrences → duplicateEdges (reported only once per pair)
 */

/** Regex for a valid edge: exactly one uppercase letter → one uppercase letter */
const VALID_EDGE_RE = /^([A-Z])->([A-Z])$/;

/**
 * @param {any[]} data - Raw input array
 * @returns {{
 *   validEdges:     [string, string][],
 *   invalidEntries: string[],
 *   duplicateEdges: string[],
 * }}
 */
exports.validateAndDeduplicate = (data) => {
  const validEdges       = [];
  const invalidEntries   = [];
  const duplicateEdges   = [];
  const seenPairs        = new Set(); // tracks first-occurrence canonical pairs
  const reportedDups     = new Set(); // prevents the same pair entering duplicateEdges twice

  for (const entry of data) {
    const raw     = String(entry);
    const trimmed = raw.trim();

    const match = trimmed.match(VALID_EDGE_RE);

    // ── Reject if format is wrong or it's a self-loop ─────────────────────────
    if (!match || match[1] === match[2]) {
      invalidEntries.push(raw);
      continue;
    }

    const [, parent, child] = match;
    const pair = `${parent}->${child}`;

    if (seenPairs.has(pair)) {
      // ── Duplicate: report once per unique repeated pair ─────────────────────
      if (!reportedDups.has(pair)) {
        duplicateEdges.push(pair);
        reportedDups.add(pair);
      }
    } else {
      // ── First occurrence: accept ────────────────────────────────────────────
      seenPairs.add(pair);
      validEdges.push([parent, child]);
    }
  }

  return { validEdges, invalidEntries, duplicateEdges };
};
