'use strict';

/**
 * tests/utils/validator.test.js
 *
 * Unit tests for the input validation & deduplication layer.
 * Covers every rule listed in the challenge spec.
 */
const { validateAndDeduplicate } = require('../../src/utils/validator');

// ─────────────────────────────────────────────────────────────────────────────
describe('validator — valid entries', () => {
  test('accepts a standard A->B edge', () => {
    const { validEdges, invalidEntries, duplicateEdges } = validateAndDeduplicate(['A->B']);
    expect(validEdges).toEqual([['A', 'B']]);
    expect(invalidEntries).toHaveLength(0);
    expect(duplicateEdges).toHaveLength(0);
  });

  test('accepts all letters A–Z on both sides', () => {
    const { validEdges } = validateAndDeduplicate(['Z->A']);
    expect(validEdges).toEqual([['Z', 'A']]);
  });

  test('trims leading/trailing whitespace before validating (spec: " A->B " is valid)', () => {
    const { validEdges, invalidEntries } = validateAndDeduplicate([' A->B ']);
    expect(validEdges).toEqual([['A', 'B']]);
    expect(invalidEntries).toHaveLength(0);
  });

  test('trims and uses the canonical pair for duplicate detection', () => {
    // "A->B" and " A->B " should be treated as the same pair
    const { validEdges, duplicateEdges } = validateAndDeduplicate(['A->B', ' A->B ']);
    expect(validEdges).toHaveLength(1);
    expect(duplicateEdges).toEqual(['A->B']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validator — invalid entries (spec table)', () => {
  const invalidCases = [
    ['hello',    'plain word — not a node format'],
    ['1->2',     'digits — not uppercase letters'],
    ['AB->C',    'multi-character parent node'],
    ['A->BC',    'multi-character child node'],
    ['a->b',     'lowercase letters'],
    ['A-B',      'wrong separator (missing >)'],
    ['A->',      'missing child node'],
    ['->B',      'missing parent node'],
    ['A->A',     'self-loop — explicitly invalid per spec'],
    ['',         'empty string'],
    [' ',        'whitespace-only string'],
    ['A->B->C',  'chained notation — not a single edge'],
  ];

  test.each(invalidCases)('rejects "%s" (%s)', (input) => {
    const { validEdges, invalidEntries } = validateAndDeduplicate([input]);
    expect(validEdges).toHaveLength(0);
    expect(invalidEntries).toHaveLength(1);
  });

  test('pushes the original (pre-trim) raw string to invalidEntries', () => {
    const { invalidEntries } = validateAndDeduplicate([' hello ']);
    expect(invalidEntries[0]).toBe(' hello ');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validator — duplicate edge rules', () => {
  test('three identical edges produce one validEdge and one duplicateEdge entry', () => {
    // Spec example: ["A->B","A->B","A->B"] → duplicate_edges: ["A->B"]
    const { validEdges, duplicateEdges } = validateAndDeduplicate(['A->B', 'A->B', 'A->B']);
    expect(validEdges).toHaveLength(1);
    expect(duplicateEdges).toEqual(['A->B']);  // reported only once
  });

  test('A->B and B->A are distinct pairs — neither is a duplicate', () => {
    const { validEdges, duplicateEdges } = validateAndDeduplicate(['A->B', 'B->A']);
    expect(validEdges).toHaveLength(2);
    expect(duplicateEdges).toHaveLength(0);
  });

  test('two different duplicate pairs are both reported', () => {
    const input = ['A->B', 'C->D', 'A->B', 'C->D', 'C->D'];
    const { validEdges, duplicateEdges } = validateAndDeduplicate(input);
    expect(validEdges).toHaveLength(2);          // A->B (first), C->D (first)
    expect(duplicateEdges).toEqual(['A->B', 'C->D']); // each pair listed once
  });

  test('second occurrence goes to duplicateEdges; third+ is silently ignored', () => {
    const { validEdges, duplicateEdges } = validateAndDeduplicate(
      Array(10).fill('A->B')
    );
    expect(validEdges).toHaveLength(1);
    expect(duplicateEdges).toHaveLength(1);  // still only one entry
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validator — mixed & edge cases', () => {
  test('processes valid, invalid, and duplicate in one pass', () => {
    const input = ['A->B', 'hello', 'A->B', 'B->C', '1->2'];
    const { validEdges, invalidEntries, duplicateEdges } = validateAndDeduplicate(input);
    expect(validEdges).toEqual([['A', 'B'], ['B', 'C']]);
    expect(invalidEntries).toEqual(['hello', '1->2']);
    expect(duplicateEdges).toEqual(['A->B']);
  });

  test('empty input array returns three empty arrays', () => {
    const result = validateAndDeduplicate([]);
    expect(result.validEdges).toHaveLength(0);
    expect(result.invalidEntries).toHaveLength(0);
    expect(result.duplicateEdges).toHaveLength(0);
  });

  test('coerces non-string values to string (null, number, undefined)', () => {
    const { invalidEntries } = validateAndDeduplicate([null, 123, undefined]);
    expect(invalidEntries).toHaveLength(3);
  });

  test('preserves input order in all three output arrays', () => {
    const input = ['P->Q', 'bad1', 'A->B', 'bad2', 'P->Q'];
    const { validEdges, invalidEntries, duplicateEdges } = validateAndDeduplicate(input);
    expect(validEdges[0]).toEqual(['P', 'Q']);
    expect(validEdges[1]).toEqual(['A', 'B']);
    expect(invalidEntries).toEqual(['bad1', 'bad2']);
    expect(duplicateEdges).toEqual(['P->Q']);
  });
});
