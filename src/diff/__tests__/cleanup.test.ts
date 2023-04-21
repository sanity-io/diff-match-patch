import {test, expect} from 'vitest'
import {cleanupSemantic, cleanupEfficiency, cleanupSemanticLossless} from '../cleanup'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff} from '../diff.js'

test('cleanupSemanticLossless', () => {
  // Slide diffs to match logical boundaries.
  // Null case.
  let diffs: Diff[] = []
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([])

  // Blank lines.
  diffs = [
    [DIFF_EQUAL, 'AAA\r\n\r\nBBB'],
    [DIFF_INSERT, '\r\nDDD\r\n\r\nBBB'],
    [DIFF_EQUAL, '\r\nEEE'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'AAA\r\n\r\n'],
    [DIFF_INSERT, 'BBB\r\nDDD\r\n\r\n'],
    [DIFF_EQUAL, 'BBB\r\nEEE'],
  ])

  // Line boundaries.
  diffs = [
    [DIFF_EQUAL, 'AAA\r\nBBB'],
    [DIFF_INSERT, ' DDD\r\nBBB'],
    [DIFF_EQUAL, ' EEE'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'AAA\r\n'],
    [DIFF_INSERT, 'BBB DDD\r\n'],
    [DIFF_EQUAL, 'BBB EEE'],
  ])

  // Word boundaries.
  diffs = [
    [DIFF_EQUAL, 'The c'],
    [DIFF_INSERT, 'ow and the c'],
    [DIFF_EQUAL, 'at.'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'The '],
    [DIFF_INSERT, 'cow and the '],
    [DIFF_EQUAL, 'cat.'],
  ])

  // Alphanumeric boundaries.
  diffs = [
    [DIFF_EQUAL, 'The-c'],
    [DIFF_INSERT, 'ow-and-the-c'],
    [DIFF_EQUAL, 'at.'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'The-'],
    [DIFF_INSERT, 'cow-and-the-'],
    [DIFF_EQUAL, 'cat.'],
  ])

  // Hitting the start.
  diffs = [
    [DIFF_EQUAL, 'a'],
    [DIFF_DELETE, 'a'],
    [DIFF_EQUAL, 'ax'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'a'],
    [DIFF_EQUAL, 'aax'],
  ])

  // Hitting the end.
  diffs = [
    [DIFF_EQUAL, 'xa'],
    [DIFF_DELETE, 'a'],
    [DIFF_EQUAL, 'a'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'xaa'],
    [DIFF_DELETE, 'a'],
  ])

  // Sentence boundaries.
  diffs = [
    [DIFF_EQUAL, 'The xxx. The '],
    [DIFF_INSERT, 'zzz. The '],
    [DIFF_EQUAL, 'yyy.'],
  ]
  diffs = cleanupSemanticLossless(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'The xxx.'],
    [DIFF_INSERT, ' The zzz.'],
    [DIFF_EQUAL, ' The yyy.'],
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
    [DIFF_DELETE, 'ab'],
    [DIFF_INSERT, 'cd'],
    [DIFF_EQUAL, '12'],
    [DIFF_DELETE, 'e'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'ab'],
    [DIFF_INSERT, 'cd'],
    [DIFF_EQUAL, '12'],
    [DIFF_DELETE, 'e'],
  ])

  // No elimination #2.
  diffs = [
    [DIFF_DELETE, 'abc'],
    [DIFF_INSERT, 'ABC'],
    [DIFF_EQUAL, '1234'],
    [DIFF_DELETE, 'wxyz'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abc'],
    [DIFF_INSERT, 'ABC'],
    [DIFF_EQUAL, '1234'],
    [DIFF_DELETE, 'wxyz'],
  ])

  // Simple elimination.
  diffs = [
    [DIFF_DELETE, 'a'],
    [DIFF_EQUAL, 'b'],
    [DIFF_DELETE, 'c'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abc'],
    [DIFF_INSERT, 'b'],
  ])

  // Backpass elimination.
  diffs = [
    [DIFF_DELETE, 'ab'],
    [DIFF_EQUAL, 'cd'],
    [DIFF_DELETE, 'e'],
    [DIFF_EQUAL, 'f'],
    [DIFF_INSERT, 'g'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abcdef'],
    [DIFF_INSERT, 'cdfg'],
  ])

  // Multiple eliminations.
  diffs = [
    [DIFF_INSERT, '1'],
    [DIFF_EQUAL, 'A'],
    [DIFF_DELETE, 'B'],
    [DIFF_INSERT, '2'],
    [DIFF_EQUAL, '_'],
    [DIFF_INSERT, '1'],
    [DIFF_EQUAL, 'A'],
    [DIFF_DELETE, 'B'],
    [DIFF_INSERT, '2'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'AB_AB'],
    [DIFF_INSERT, '1A2_1A2'],
  ])

  // Word boundaries.
  diffs = [
    [DIFF_EQUAL, 'The c'],
    [DIFF_DELETE, 'ow and the c'],
    [DIFF_EQUAL, 'at.'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'The '],
    [DIFF_DELETE, 'cow and the '],
    [DIFF_EQUAL, 'cat.'],
  ])

  // No overlap elimination.
  diffs = [
    [DIFF_DELETE, 'abcxx'],
    [DIFF_INSERT, 'xxdef'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abcxx'],
    [DIFF_INSERT, 'xxdef'],
  ])

  // Overlap elimination.
  diffs = [
    [DIFF_DELETE, 'abcxxx'],
    [DIFF_INSERT, 'xxxdef'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abc'],
    [DIFF_EQUAL, 'xxx'],
    [DIFF_INSERT, 'def'],
  ])

  // Reverse overlap elimination.
  diffs = [
    [DIFF_DELETE, 'xxxabc'],
    [DIFF_INSERT, 'defxxx'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_INSERT, 'def'],
    [DIFF_EQUAL, 'xxx'],
    [DIFF_DELETE, 'abc'],
  ])

  // Two overlap eliminations.
  diffs = [
    [DIFF_DELETE, 'abcd1212'],
    [DIFF_INSERT, '1212efghi'],
    [DIFF_EQUAL, '----'],
    [DIFF_DELETE, 'A3'],
    [DIFF_INSERT, '3BC'],
  ]
  diffs = cleanupSemantic(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abcd'],
    [DIFF_EQUAL, '1212'],
    [DIFF_INSERT, 'efghi'],
    [DIFF_EQUAL, '----'],
    [DIFF_DELETE, 'A'],
    [DIFF_EQUAL, '3'],
    [DIFF_INSERT, 'BC'],
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
    [DIFF_DELETE, 'ab'],
    [DIFF_INSERT, '12'],
    [DIFF_EQUAL, 'wxyz'],
    [DIFF_DELETE, 'cd'],
    [DIFF_INSERT, '34'],
  ]
  diffs = cleanupEfficiency(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'ab'],
    [DIFF_INSERT, '12'],
    [DIFF_EQUAL, 'wxyz'],
    [DIFF_DELETE, 'cd'],
    [DIFF_INSERT, '34'],
  ])

  // Four-edit elimination.
  diffs = [
    [DIFF_DELETE, 'ab'],
    [DIFF_INSERT, '12'],
    [DIFF_EQUAL, 'xyz'],
    [DIFF_DELETE, 'cd'],
    [DIFF_INSERT, '34'],
  ]
  diffs = cleanupEfficiency(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abxyzcd'],
    [DIFF_INSERT, '12xyz34'],
  ])

  // Three-edit elimination.
  diffs = [
    [DIFF_INSERT, '12'],
    [DIFF_EQUAL, 'x'],
    [DIFF_DELETE, 'cd'],
    [DIFF_INSERT, '34'],
  ]
  diffs = cleanupEfficiency(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'xcd'],
    [DIFF_INSERT, '12x34'],
  ])

  // Backpass elimination.
  diffs = [
    [DIFF_DELETE, 'ab'],
    [DIFF_INSERT, '12'],
    [DIFF_EQUAL, 'xy'],
    [DIFF_INSERT, '34'],
    [DIFF_EQUAL, 'z'],
    [DIFF_DELETE, 'cd'],
    [DIFF_INSERT, '56'],
  ]
  diffs = cleanupEfficiency(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abxyzcd'],
    [DIFF_INSERT, '12xy34z56'],
  ])

  // High cost elimination.
  diffs = [
    [DIFF_DELETE, 'ab'],
    [DIFF_INSERT, '12'],
    [DIFF_EQUAL, 'wxyz'],
    [DIFF_DELETE, 'cd'],
    [DIFF_INSERT, '34'],
  ]
  diffs = cleanupEfficiency(diffs, 5)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abwxyzcd'],
    [DIFF_INSERT, '12wxyz34'],
  ])
})
