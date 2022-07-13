import { cleanupMerge } from '../cleanup'
import { Diff, DiffType } from '../diff'

test('cleanupMerge', () => {
  // Cleanup a messy diff.
  // Null case.
  let diffs: Diff[] = []
  cleanupMerge(diffs)
  expect(diffs).toEqual([])

  // No change case.
  diffs = [
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 'b'],
    [DiffType.INSERT, 'c'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 'b'],
    [DiffType.INSERT, 'c'],
  ])

  // Merge equalities.
  diffs = [[DiffType.EQUAL, 'a'], [DiffType.EQUAL, 'b'], [DiffType.EQUAL, 'c']]
  cleanupMerge(diffs)
  expect(diffs).toEqual([[DiffType.EQUAL, 'abc']])

  // Merge deletions.
  diffs = [
    [DiffType.DELETE, 'a'],
    [DiffType.DELETE, 'b'],
    [DiffType.DELETE, 'c'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([[DiffType.DELETE, 'abc']])

  // Merge insertions.
  diffs = [
    [DiffType.INSERT, 'a'],
    [DiffType.INSERT, 'b'],
    [DiffType.INSERT, 'c'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([[DiffType.INSERT, 'abc']])

  // Merge interweave.
  diffs = [
    [DiffType.DELETE, 'a'],
    [DiffType.INSERT, 'b'],
    [DiffType.DELETE, 'c'],
    [DiffType.INSERT, 'd'],
    [DiffType.EQUAL, 'e'],
    [DiffType.EQUAL, 'f'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DiffType.DELETE, 'ac'],
    [DiffType.INSERT, 'bd'],
    [DiffType.EQUAL, 'ef'],
  ])

  // Prefix and suffix detection.
  diffs = [
    [DiffType.DELETE, 'a'],
    [DiffType.INSERT, 'abc'],
    [DiffType.DELETE, 'dc'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 'd'],
    [DiffType.INSERT, 'b'],
    [DiffType.EQUAL, 'c'],
  ])

  // Prefix and suffix detection with equalities.
  diffs = [
    [DiffType.EQUAL, 'x'],
    [DiffType.DELETE, 'a'],
    [DiffType.INSERT, 'abc'],
    [DiffType.DELETE, 'dc'],
    [DiffType.EQUAL, 'y'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'xa'],
    [DiffType.DELETE, 'd'],
    [DiffType.INSERT, 'b'],
    [DiffType.EQUAL, 'cy'],
  ])

  // Slide edit left.
  diffs = [
    [DiffType.EQUAL, 'a'],
    [DiffType.INSERT, 'ba'],
    [DiffType.EQUAL, 'c'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([[DiffType.INSERT, 'ab'], [DiffType.EQUAL, 'ac']])

  // Slide edit right.
  diffs = [
    [DiffType.EQUAL, 'c'],
    [DiffType.INSERT, 'ab'],
    [DiffType.EQUAL, 'a'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([[DiffType.EQUAL, 'ca'], [DiffType.INSERT, 'ba']])

  // Slide edit left recursive.
  diffs = [
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 'b'],
    [DiffType.EQUAL, 'c'],
    [DiffType.DELETE, 'ac'],
    [DiffType.EQUAL, 'x'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([[DiffType.DELETE, 'abc'], [DiffType.EQUAL, 'acx']])

  // Slide edit right recursive.
  diffs = [
    [DiffType.EQUAL, 'x'],
    [DiffType.DELETE, 'ca'],
    [DiffType.EQUAL, 'c'],
    [DiffType.DELETE, 'b'],
    [DiffType.EQUAL, 'a'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([[DiffType.EQUAL, 'xca'], [DiffType.DELETE, 'cba']])

  // Empty merge.
  diffs = [
    [DiffType.DELETE, 'b'],
    [DiffType.INSERT, 'ab'],
    [DiffType.EQUAL, 'c'],
  ]
  cleanupMerge(diffs)
  expect(diffs).toEqual([[DiffType.INSERT, 'a'], [DiffType.EQUAL, 'bc']])

  // Empty equality.
  diffs = [[DiffType.EQUAL, ''], [DiffType.INSERT, 'a'], [DiffType.EQUAL, 'b']]
  cleanupMerge(diffs)
  expect(diffs).toEqual([[DiffType.INSERT, 'a'], [DiffType.EQUAL, 'b']])
})
