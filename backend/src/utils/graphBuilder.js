'use strict';

/**
 * utils/graphBuilder.js
 *
 * Constructs the directed graph from validated edges and discovers
 * connected components for downstream tree/cycle processing.
 */

// ── Graph Construction ────────────────────────────────────────────────────────

/**
 * Builds a directed adjacency structure from valid edges.
 *
 * Rules applied here:
 *   • First-parent-wins — if a child already has an assigned parent,
 *     any subsequent edge pointing to that same child is silently discarded.
 *   • Node insertion order is recorded so component discovery is deterministic
 *     (matches the order nodes first appear in the input).
 *
 * @param {[string, string][]} validEdges - Array of [parent, child] tuples
 * @returns {{
 *   childToParent:    Record<string, string>,
 *   parentToChildren: Record<string, string[]>,
 *   nodeOrder:        Map<string, number>,
 * }}
 */
exports.buildGraph = (validEdges) => {
  /** child → parent (first assignment wins) */
  const childToParent = {};

  /** parent → ordered list of accepted children */
  const parentToChildren = {};

  /** Preserves the order nodes are first encountered */
  const nodeOrder = new Map();
  let idx = 0;

  for (const [parent, child] of validEdges) {
    // Register nodes in first-seen order
    if (!nodeOrder.has(parent)) nodeOrder.set(parent, idx++);
    if (!nodeOrder.has(child))  nodeOrder.set(child,  idx++);

    // ── First-parent-wins ──────────────────────────────────────────────────────
    if (childToParent[child] === undefined) {
      childToParent[child] = parent;
      if (!parentToChildren[parent]) parentToChildren[parent] = [];
      parentToChildren[parent].push(child);
    }
    // else → silently discard: this child already has a parent
  }

  return { childToParent, parentToChildren, nodeOrder };
};

// ── Component Discovery ───────────────────────────────────────────────────────

/**
 * Finds all connected components using undirected BFS.
 *
 * "Undirected" here means we traverse both the forward edge (parent→child)
 * and the reverse edge (child→parent) to group all reachable nodes together,
 * regardless of edge direction.
 *
 * Nodes are visited in first-seen order (from nodeOrder) so the resulting
 * component array matches the input ordering.
 *
 * @param {Map<string, number>} nodeOrder
 * @param {Record<string, string>}   childToParent
 * @param {Record<string, string[]>} parentToChildren
 * @returns {string[][]} Array of components; each component is an ordered node array
 */
exports.findComponents = (nodeOrder, childToParent, parentToChildren) => {
  const visited    = new Set();
  const components = [];

  for (const startNode of nodeOrder.keys()) {
    if (visited.has(startNode)) continue;

    const component = [];
    const queue     = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const curr = queue.shift();
      component.push(curr);

      // Forward edges: curr → children
      for (const child of (parentToChildren[curr] || [])) {
        if (!visited.has(child)) {
          visited.add(child);
          queue.push(child);
        }
      }

      // Reverse edge: curr ← parent  (makes BFS undirected)
      const par = childToParent[curr];
      if (par !== undefined && !visited.has(par)) {
        visited.add(par);
        queue.push(par);
      }
    }

    components.push(component);
  }

  return components;
};
