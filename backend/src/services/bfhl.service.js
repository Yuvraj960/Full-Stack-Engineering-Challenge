'use strict';

/**
 * services/bfhl.service.js
 *
 * Orchestrates the full data-processing pipeline:
 *   1. Validate & deduplicate input
 *   2. Build directed graph (first-parent-wins)
 *   3. Find connected components (undirected BFS)
 *   4. Build hierarchies & compute summary
 *
 * Returns the complete API response object (sans HTTP concerns).
 */
const identity        = require('../config/identity');
const { validateAndDeduplicate } = require('../utils/validator');
const { buildGraph, findComponents } = require('../utils/graphBuilder');
const { buildHierarchies }           = require('../utils/treeProcessor');

/**
 * @param {any[]} data - Raw input array from the request body
 * @returns {Object} Full API response payload
 */
exports.process = (data) => {
  // Step 1 ── Validate & deduplicate
  const { validEdges, invalidEntries, duplicateEdges } = validateAndDeduplicate(data);

  // Step 2 ── Build directed graph (first-parent-wins)
  const { childToParent, parentToChildren, nodeOrder } = buildGraph(validEdges);

  // Step 3 ── Find connected components via undirected BFS
  const components = findComponents(nodeOrder, childToParent, parentToChildren);

  // Step 4 ── Build hierarchies and summary
  const { hierarchies, summary } = buildHierarchies(components, childToParent, parentToChildren);

  return {
    ...identity,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary,
  };
};
