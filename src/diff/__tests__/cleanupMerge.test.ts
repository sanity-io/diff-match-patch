import {test, expect} from 'vitest'
import {cleanupMerge} from '../cleanup.js'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff} from '../diff.js'

test('cleanupMerge', () => {
  // Cleanup a messy diff.
  // Null case.
  let diffs: Diff[] = []
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([])

  // No change case.
  diffs = [
    [DIFF_EQUAL, 'a'],
    [DIFF_DELETE, 'b'],
    [DIFF_INSERT, 'c'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'a'],
    [DIFF_DELETE, 'b'],
    [DIFF_INSERT, 'c'],
  ])

  // Merge equalities.
  diffs = [
    [DIFF_EQUAL, 'a'],
    [DIFF_EQUAL, 'b'],
    [DIFF_EQUAL, 'c'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([[DIFF_EQUAL, 'abc']])

  // Merge deletions.
  diffs = [
    [DIFF_DELETE, 'a'],
    [DIFF_DELETE, 'b'],
    [DIFF_DELETE, 'c'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([[DIFF_DELETE, 'abc']])

  // Merge insertions.
  diffs = [
    [DIFF_INSERT, 'a'],
    [DIFF_INSERT, 'b'],
    [DIFF_INSERT, 'c'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([[DIFF_INSERT, 'abc']])

  // Merge interweave.
  diffs = [
    [DIFF_DELETE, 'a'],
    [DIFF_INSERT, 'b'],
    [DIFF_DELETE, 'c'],
    [DIFF_INSERT, 'd'],
    [DIFF_EQUAL, 'e'],
    [DIFF_EQUAL, 'f'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'ac'],
    [DIFF_INSERT, 'bd'],
    [DIFF_EQUAL, 'ef'],
  ])

  // Prefix and suffix detection.
  diffs = [
    [DIFF_DELETE, 'a'],
    [DIFF_INSERT, 'abc'],
    [DIFF_DELETE, 'dc'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'a'],
    [DIFF_DELETE, 'd'],
    [DIFF_INSERT, 'b'],
    [DIFF_EQUAL, 'c'],
  ])

  // Prefix and suffix detection with equalities.
  diffs = [
    [DIFF_EQUAL, 'x'],
    [DIFF_DELETE, 'a'],
    [DIFF_INSERT, 'abc'],
    [DIFF_DELETE, 'dc'],
    [DIFF_EQUAL, 'y'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'xa'],
    [DIFF_DELETE, 'd'],
    [DIFF_INSERT, 'b'],
    [DIFF_EQUAL, 'cy'],
  ])

  // Slide edit left.
  diffs = [
    [DIFF_EQUAL, 'a'],
    [DIFF_INSERT, 'ba'],
    [DIFF_EQUAL, 'c'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_INSERT, 'ab'],
    [DIFF_EQUAL, 'ac'],
  ])

  // Slide edit right.
  diffs = [
    [DIFF_EQUAL, 'c'],
    [DIFF_INSERT, 'ab'],
    [DIFF_EQUAL, 'a'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'ca'],
    [DIFF_INSERT, 'ba'],
  ])

  // Slide edit left recursive.
  diffs = [
    [DIFF_EQUAL, 'a'],
    [DIFF_DELETE, 'b'],
    [DIFF_EQUAL, 'c'],
    [DIFF_DELETE, 'ac'],
    [DIFF_EQUAL, 'x'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_DELETE, 'abc'],
    [DIFF_EQUAL, 'acx'],
  ])

  // Slide edit right recursive.
  diffs = [
    [DIFF_EQUAL, 'x'],
    [DIFF_DELETE, 'ca'],
    [DIFF_EQUAL, 'c'],
    [DIFF_DELETE, 'b'],
    [DIFF_EQUAL, 'a'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_EQUAL, 'xca'],
    [DIFF_DELETE, 'cba'],
  ])

  // Empty merge.
  diffs = [
    [DIFF_DELETE, 'b'],
    [DIFF_INSERT, 'ab'],
    [DIFF_EQUAL, 'c'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_INSERT, 'a'],
    [DIFF_EQUAL, 'bc'],
  ])

  // Empty equality.
  diffs = [
    [DIFF_EQUAL, ''],
    [DIFF_INSERT, 'a'],
    [DIFF_EQUAL, 'b'],
  ]
  diffs = cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DIFF_INSERT, 'a'],
    [DIFF_EQUAL, 'b'],
  ])
})
