import {test, expect, describe} from 'vitest'
import {cleanupEfficiency} from '../cleanup'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, type Diff} from '../diff.js'

describe('cleanupEfficiency', () => {
  test('Null case', () => {
    let diffs: Diff[] = []
    diffs = cleanupEfficiency(diffs)
    expect(diffs).toEqual([])
  })

  test('No elimination', () => {
    let diffs: Diff[] = [
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
  })

  test('Four-edit elimination', () => {
    let diffs: Diff[] = [
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
  })

  test('Three-edit elimination', () => {
    let diffs: Diff[] = [
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
  })

  test('Backpass elimination', () => {
    let diffs: Diff[] = [
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
  })

  test('High cost elimination', () => {
    let diffs: Diff[] = [
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
})
