'use strict';

/**
 * tests/utils/graphBuilder.test.js
 *
 * Unit tests for the directed graph builder and undirected BFS component finder.
 */
const { buildGraph, findComponents } = require('../../src/utils/graphBuilder');

// ─────────────────────────────────────────────────────────────────────────────
describe('buildGraph — basic construction', () => {
  test('creates childToParent and parentToChildren for a single edge', () => {
    const { childToParent, parentToChildren } = buildGraph([['A', 'B']]);
    expect(childToParent['B']).toBe('A');
    expect(parentToChildren['A']).toEqual(['B']);
  });

  test('a node can have multiple children (all accepted)', () => {
    const { parentToChildren } = buildGraph([['A', 'B'], ['A', 'C'], ['A', 'D']]);
    expect(parentToChildren['A']).toEqual(['B', 'C', 'D']);
  });

  test('children are stored in input order', () => {
    const { parentToChildren } = buildGraph([['A', 'C'], ['A', 'B']]);
    expect(parentToChildren['A']).toEqual(['C', 'B']); // C first, as in input
  });

  test('builds a linear chain A→B→C correctly', () => {
    const { childToParent, parentToChildren } = buildGraph([['A', 'B'], ['B', 'C']]);
    expect(childToParent['B']).toBe('A');
    expect(childToParent['C']).toBe('B');
    expect(parentToChildren['A']).toEqual(['B']);
    expect(parentToChildren['B']).toEqual(['C']);
  });

  test('empty edges produces empty graph', () => {
    const { childToParent, parentToChildren, nodeOrder } = buildGraph([]);
    expect(Object.keys(childToParent)).toHaveLength(0);
    expect(Object.keys(parentToChildren)).toHaveLength(0);
    expect(nodeOrder.size).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('buildGraph — first-parent-wins rule', () => {
  test('first edge A->C wins; B->C (second) is silently discarded', () => {
    const { childToParent, parentToChildren } = buildGraph([['A', 'C'], ['B', 'C']]);

    // C's parent must be A (first encountered)
    expect(childToParent['C']).toBe('A');

    // B should have no children recorded (its edge was dropped)
    expect(parentToChildren['B']).toBeUndefined();
  });

  test('once a child has a parent, any further parent edges are all ignored', () => {
    const edges = [['A', 'D'], ['B', 'D'], ['C', 'D']]; // B->D and C->D discarded
    const { childToParent } = buildGraph(edges);
    expect(childToParent['D']).toBe('A');
  });

  test('discarding B->C does not prevent B from being a root in its own tree', () => {
    // A->C wins; B->C discarded. B has no children/parent → isolated node.
    const { childToParent, parentToChildren, nodeOrder } = buildGraph([['A', 'C'], ['B', 'C']]);
    // B is still in nodeOrder (it appeared in an edge)
    expect(nodeOrder.has('B')).toBe(true);
    // B has no parent and no children
    expect(childToParent['B']).toBeUndefined();
    expect(parentToChildren['B']).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('buildGraph — nodeOrder (insertion order)', () => {
  test('nodes are recorded in the order they first appear in edges', () => {
    const { nodeOrder } = buildGraph([['P', 'Q'], ['Q', 'R'], ['A', 'B']]);
    const keys = [...nodeOrder.keys()];
    expect(keys).toEqual(['P', 'Q', 'R', 'A', 'B']);
  });

  test('a node seen as both parent and child is only recorded once (first time)', () => {
    // B appears as child of A first, then as parent of C
    const { nodeOrder } = buildGraph([['A', 'B'], ['B', 'C']]);
    const keys = [...nodeOrder.keys()];
    expect(keys).toEqual(['A', 'B', 'C']);
    expect(keys.filter(k => k === 'B')).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('findComponents — connected component detection', () => {
  test('a single edge creates one component with 2 nodes', () => {
    const { childToParent, parentToChildren, nodeOrder } = buildGraph([['A', 'B']]);
    const components = findComponents(nodeOrder, childToParent, parentToChildren);
    expect(components).toHaveLength(1);
    expect(components[0].sort()).toEqual(['A', 'B']);
  });

  test('two unconnected trees become two separate components', () => {
    const { childToParent, parentToChildren, nodeOrder } = buildGraph([['A', 'B'], ['P', 'Q']]);
    const components = findComponents(nodeOrder, childToParent, parentToChildren);
    expect(components).toHaveLength(2);
  });

  test('a linear chain A→B→C→D is one component', () => {
    const edges = [['A', 'B'], ['B', 'C'], ['C', 'D']];
    const { childToParent, parentToChildren, nodeOrder } = buildGraph(edges);
    const components = findComponents(nodeOrder, childToParent, parentToChildren);
    expect(components).toHaveLength(1);
    expect(components[0].sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  test('a cycle X→Y→Z→X forms one component (all 3 nodes)', () => {
    const edges = [['X', 'Y'], ['Y', 'Z'], ['Z', 'X']];
    const { childToParent, parentToChildren, nodeOrder } = buildGraph(edges);
    const components = findComponents(nodeOrder, childToParent, parentToChildren);
    expect(components).toHaveLength(1);
    expect(components[0].sort()).toEqual(['X', 'Y', 'Z']);
  });

  test('components are returned in input-first-appearance order', () => {
    // A->B comes first, then P->Q — so A's component should be listed first
    const { childToParent, parentToChildren, nodeOrder } = buildGraph([['A', 'B'], ['P', 'Q']]);
    const components = findComponents(nodeOrder, childToParent, parentToChildren);
    expect(components[0]).toContain('A');
    expect(components[1]).toContain('P');
  });

  test('spec example produces 4 components (A-tree, X-cycle, P-tree, G-tree)', () => {
    const edges = [
      ['A','B'],['A','C'],['B','D'],['C','E'],['E','F'],
      ['X','Y'],['Y','Z'],['Z','X'],
      ['P','Q'],['Q','R'],
      ['G','H'],['G','I'],
    ];
    const { childToParent, parentToChildren, nodeOrder } = buildGraph(edges);
    const components = findComponents(nodeOrder, childToParent, parentToChildren);
    expect(components).toHaveLength(4);
  });
});
