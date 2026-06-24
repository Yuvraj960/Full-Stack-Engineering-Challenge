'use strict';

/**
 * utils/treeProcessor.js
 *
 * Converts connected components into structured hierarchy objects and
 * computes the final summary.
 *
 * Per-component rules:
 *   • Pure cycle  — no node has in-degree 0  →  has_cycle: true, tree: {}
 *   • Valid tree  — exactly one root (in-degree 0) after first-parent-wins
 *                   →  nested tree object + depth field
 */

// ── Private Helpers ───────────────────────────────────────────────────────────

/**
 * Recursively builds a nested subtree object for a given node.
 * The returned object does NOT wrap the node itself — it returns its children map.
 *
 * Example:  buildSubtree('A', { A: ['B', 'C'], B: ['D'] })
 *           → { B: { D: {} }, C: {} }
 *
 * @param {string}                   node
 * @param {Record<string, string[]>} parentToChildren
 * @returns {Object}
 */
const buildSubtree = (node, parentToChildren) => {
  const obj = {};
  for (const child of (parentToChildren[node] || [])) {
    obj[child] = buildSubtree(child, parentToChildren);
  }
  return obj;
};

/**
 * Calculates depth = number of nodes on the longest root-to-leaf path.
 *
 * Example:  A → B → C  →  depth 3
 *           A → B, A → C → D  →  depth 3 (A→C→D)
 *
 * @param {string}                   node
 * @param {Record<string, string[]>} parentToChildren
 * @returns {number}
 */
const calculateDepth = (node, parentToChildren) => {
  const children = parentToChildren[node] || [];
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map(c => calculateDepth(c, parentToChildren)));
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Iterates through connected components and produces hierarchy entries + summary.
 *
 * Largest-tree tiebreaker: if two trees share the same depth, the one with the
 * lexicographically smaller root wins.
 *
 * @param {string[][]}               components
 * @param {Record<string, string>}   childToParent
 * @param {Record<string, string[]>} parentToChildren
 * @returns {{ hierarchies: Object[], summary: Object }}
 */
exports.buildHierarchies = (components, childToParent, parentToChildren) => {
  const hierarchies = [];
  let totalTrees      = 0;
  let totalCycles     = 0;
  let largestTreeRoot = null;
  let maxDepth        = -1;

  for (const component of components) {
    // Roots = nodes that never appear as a child (in-degree 0 in directed graph)
    const roots = component
      .filter(n => childToParent[n] === undefined)
      .sort(); // sort so lex ordering is consistent when multiple roots exist

    // ── Pure cycle ─────────────────────────────────────────────────────────────
    if (roots.length === 0) {
      // All nodes in this component have a parent → it's a cycle with no entry point.
      // Representative root = lexicographically smallest node.
      const root = [...component].sort()[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
      totalCycles++;
      continue;
    }

    // ── Valid tree(s) ──────────────────────────────────────────────────────────
    // With first-parent-wins applied upstream, each component should have
    // exactly one root. We loop for robustness.
    for (const root of roots) {
      const depth   = calculateDepth(root, parentToChildren);
      const subtree = buildSubtree(root, parentToChildren);

      hierarchies.push({ root, tree: { [root]: subtree }, depth });
      totalTrees++;

      // Update the largest-tree tracker
      if (
        depth > maxDepth ||
        (depth === maxDepth && largestTreeRoot !== null && root < largestTreeRoot)
      ) {
        maxDepth        = depth;
        largestTreeRoot = root;
      }
    }
  }

  return {
    hierarchies,
    summary: {
      total_trees:       totalTrees,
      total_cycles:      totalCycles,
      largest_tree_root: largestTreeRoot !== null ? largestTreeRoot : '',
    },
  };
};
