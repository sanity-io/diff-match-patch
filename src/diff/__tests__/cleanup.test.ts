import {test, expect} from 'vitest'
import {cleanupSemantic, cleanupEfficiency, cleanupSemanticLossless} from '../cleanup'
import {Diff, DiffType} from '../diff.js'

test('cleanupSemanticLossless', () => {
  // Slide diffs to match logical boundaries.
  // Null case.
  let diffs: Diff[] = []
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([])

  // Blank lines.
  diffs = [
    [DiffType.EQUAL, 'AAA\r\n\r\nBBB'],
    [DiffType.INSERT, '\r\nDDD\r\n\r\nBBB'],
    [DiffType.EQUAL, '\r\nEEE'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'AAA\r\n\r\n'],
    [DiffType.INSERT, 'BBB\r\nDDD\r\n\r\n'],
    [DiffType.EQUAL, 'BBB\r\nEEE'],
  ])

  // Line boundaries.
  diffs = [
    [DiffType.EQUAL, 'AAA\r\nBBB'],
    [DiffType.INSERT, ' DDD\r\nBBB'],
    [DiffType.EQUAL, ' EEE'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'AAA\r\n'],
    [DiffType.INSERT, 'BBB DDD\r\n'],
    [DiffType.EQUAL, 'BBB EEE'],
  ])

  // Word boundaries.
  diffs = [
    [DiffType.EQUAL, 'The c'],
    [DiffType.INSERT, 'ow and the c'],
    [DiffType.EQUAL, 'at.'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'The '],
    [DiffType.INSERT, 'cow and the '],
    [DiffType.EQUAL, 'cat.'],
  ])

  // Alphanumeric boundaries.
  diffs = [
    [DiffType.EQUAL, 'The-c'],
    [DiffType.INSERT, 'ow-and-the-c'],
    [DiffType.EQUAL, 'at.'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'The-'],
    [DiffType.INSERT, 'cow-and-the-'],
    [DiffType.EQUAL, 'cat.'],
  ])

  // Hitting the start.
  diffs = [
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 'a'],
    [DiffType.EQUAL, 'ax'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'a'],
    [DiffType.EQUAL, 'aax'],
  ])

  // Hitting the end.
  diffs = [
    [DiffType.EQUAL, 'xa'],
    [DiffType.DELETE, 'a'],
    [DiffType.EQUAL, 'a'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'xaa'],
    [DiffType.DELETE, 'a'],
  ])

  // Sentence boundaries.
  diffs = [
    [DiffType.EQUAL, 'The xxx. The '],
    [DiffType.INSERT, 'zzz. The '],
    [DiffType.EQUAL, 'yyy.'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'The xxx.'],
    [DiffType.INSERT, ' The zzz.'],
    [DiffType.EQUAL, ' The yyy.'],
  ])
})

test('cleanupSemantic', () => {
  // Cleanup semantically trivial equalities.
  // Null case.
  let diffs: Diff[] = []
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([])

  // No elimination #1.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, 'cd'],
    [DiffType.EQUAL, '12'],
    [DiffType.DELETE, 'e'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, 'cd'],
    [DiffType.EQUAL, '12'],
    [DiffType.DELETE, 'e'],
  ])

  // No elimination #2.
  diffs = [
    [DiffType.DELETE, 'abc'],
    [DiffType.INSERT, 'ABC'],
    [DiffType.EQUAL, '1234'],
    [DiffType.DELETE, 'wxyz'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'abc'],
    [DiffType.INSERT, 'ABC'],
    [DiffType.EQUAL, '1234'],
    [DiffType.DELETE, 'wxyz'],
  ])

  // Simple elimination.
  diffs = [
    [DiffType.DELETE, 'a'],
    [DiffType.EQUAL, 'b'],
    [DiffType.DELETE, 'c'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'abc'],
    [DiffType.INSERT, 'b'],
  ])

  // Backpass elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.EQUAL, 'cd'],
    [DiffType.DELETE, 'e'],
    [DiffType.EQUAL, 'f'],
    [DiffType.INSERT, 'g'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'abcdef'],
    [DiffType.INSERT, 'cdfg'],
  ])

  // Multiple eliminations.
  diffs = [
    [DiffType.INSERT, '1'],
    [DiffType.EQUAL, 'A'],
    [DiffType.DELETE, 'B'],
    [DiffType.INSERT, '2'],
    [DiffType.EQUAL, '_'],
    [DiffType.INSERT, '1'],
    [DiffType.EQUAL, 'A'],
    [DiffType.DELETE, 'B'],
    [DiffType.INSERT, '2'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'AB_AB'],
    [DiffType.INSERT, '1A2_1A2'],
  ])

  // Word boundaries.
  diffs = [
    [DiffType.EQUAL, 'The c'],
    [DiffType.DELETE, 'ow and the c'],
    [DiffType.EQUAL, 'at.'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'The '],
    [DiffType.DELETE, 'cow and the '],
    [DiffType.EQUAL, 'cat.'],
  ])

  // No overlap elimination.
  diffs = [
    [DiffType.DELETE, 'abcxx'],
    [DiffType.INSERT, 'xxdef'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'abcxx'],
    [DiffType.INSERT, 'xxdef'],
  ])

  // Overlap elimination.
  diffs = [
    [DiffType.DELETE, 'abcxxx'],
    [DiffType.INSERT, 'xxxdef'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'abc'],
    [DiffType.EQUAL, 'xxx'],
    [DiffType.INSERT, 'def'],
  ])

  // Reverse overlap elimination.
  diffs = [
    [DiffType.DELETE, 'xxxabc'],
    [DiffType.INSERT, 'defxxx'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.INSERT, 'def'],
    [DiffType.EQUAL, 'xxx'],
    [DiffType.DELETE, 'abc'],
  ])

  // Two overlap eliminations.
  diffs = [
    [DiffType.DELETE, 'abcd1212'],
    [DiffType.INSERT, '1212efghi'],
    [DiffType.EQUAL, '----'],
    [DiffType.DELETE, 'A3'],
    [DiffType.INSERT, '3BC'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'abcd'],
    [DiffType.EQUAL, '1212'],
    [DiffType.INSERT, 'efghi'],
    [DiffType.EQUAL, '----'],
    [DiffType.DELETE, 'A'],
    [DiffType.EQUAL, '3'],
    [DiffType.INSERT, 'BC'],
  ])
})

test('cleanupEfficiency', () => {
  // Cleanup operationally trivial equalities.
  // Null case.
  let diffs: Diff[] = []
  diffs = cleanupEfficiency(diffs)
  expect(diffs).toEqual([])

  // No elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'wxyz'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '34'],
  ]
  diffs = cleanupEfficiency(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'wxyz'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '34'],
  ])

  // Four-edit elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'xyz'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '34'],
  ]
  diffs = cleanupEfficiency(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'abxyzcd'],
    [DiffType.INSERT, '12xyz34'],
  ])

  // Three-edit elimination.
  diffs = [
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'x'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '34'],
  ]
  diffs = cleanupEfficiency(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'xcd'],
    [DiffType.INSERT, '12x34'],
  ])

  // Backpass elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'xy'],
    [DiffType.INSERT, '34'],
    [DiffType.EQUAL, 'z'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '56'],
  ]
  diffs = cleanupEfficiency(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'abxyzcd'],
    [DiffType.INSERT, '12xy34z56'],
  ])

  // High cost elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'wxyz'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '34'],
  ]
  diffs = cleanupEfficiency(diffs, 5)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'abwxyzcd'],
    [DiffType.INSERT, '12wxyz34'],
  ])
})
