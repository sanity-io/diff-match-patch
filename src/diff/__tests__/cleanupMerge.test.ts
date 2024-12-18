import {describe, expect, test} from 'vitest'

import {cleanupMerge} from '../cleanup.js'
import {type Diff,DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff.js'

// Cleanup a messy diff.
describe('cleanupMerge', () => {
  test('Null case', () => {
    let diffs: Diff[] = []
    diffs = cleanupMerge(diffs)
    expect(diffs).toEqual([])
  })

  test('No change case', () => {
    let diffs: Diff[] = [
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
  })

  test('Merge equalities', () => {
    let diffs: Diff[] = [
      [DIFF_EQUAL, 'a'],
      [DIFF_EQUAL, 'b'],
      [DIFF_EQUAL, 'c'],
    ]
    diffs = cleanupMerge(diffs)
    expect(diffs).toEqual([[DIFF_EQUAL, 'abc']])
  })

  test('Merge deletions', () => {
    let diffs: Diff[] = [
      [DIFF_DELETE, 'a'],
      [DIFF_DELETE, 'b'],
      [DIFF_DELETE, 'c'],
    ]
    diffs = cleanupMerge(diffs)
    expect(diffs).toEqual([[DIFF_DELETE, 'abc']])
  })

  test('Merge insertions', () => {
    let diffs: Diff[] = [
      [DIFF_INSERT, 'a'],
      [DIFF_INSERT, 'b'],
      [DIFF_INSERT, 'c'],
    ]
    diffs = cleanupMerge(diffs)
    expect(diffs).toEqual([[DIFF_INSERT, 'abc']])
  })

  test('Merge interweave', () => {
    let diffs: Diff[] = [
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
  })

  test('Prefix and suffix detection', () => {
    let diffs: Diff[] = [
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
  })

  test('Prefix and suffix detection with equalities', () => {
    let diffs: Diff[] = [
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
  })

  test('Slide edit left', () => {
    let diffs: Diff[] = [
      [DIFF_EQUAL, 'a'],
      [DIFF_INSERT, 'ba'],
      [DIFF_EQUAL, 'c'],
    ]
    diffs = cleanupMerge(diffs)
    expect(diffs).toEqual([
      [DIFF_INSERT, 'ab'],
      [DIFF_EQUAL, 'ac'],
    ])
  })

  test('Slide edit right', () => {
    let diffs: Diff[] = [
      [DIFF_EQUAL, 'c'],
      [DIFF_INSERT, 'ab'],
      [DIFF_EQUAL, 'a'],
    ]
    diffs = cleanupMerge(diffs)
    expect(diffs).toEqual([
      [DIFF_EQUAL, 'ca'],
      [DIFF_INSERT, 'ba'],
    ])
  })

  test('Slide edit left recursive', () => {
    let diffs: Diff[] = [
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
  })

  test('Slide edit right recursive', () => {
    let diffs: Diff[] = [
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
  })

  test('Empty merge', () => {
    let diffs: Diff[] = [
      [DIFF_DELETE, 'b'],
      [DIFF_INSERT, 'ab'],
      [DIFF_EQUAL, 'c'],
    ]
    diffs = cleanupMerge(diffs)
    expect(diffs).toEqual([
      [DIFF_INSERT, 'a'],
      [DIFF_EQUAL, 'bc'],
    ])
  })

  test('Empty equality', () => {
    let diffs: Diff[] = [
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
})
