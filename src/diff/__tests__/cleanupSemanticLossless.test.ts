import {test, expect, describe} from 'vitest'
import {cleanupSemanticLossless} from '../cleanup'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, type Diff} from '../diff.js'

// Slide diffs to match logical boundaries.
describe('cleanupSemanticLossless', () => {
  test('Null case', () => {
    let diffs: Diff[] = []
    diffs = cleanupSemanticLossless(diffs)
    expect(diffs).toEqual([])
  })

  test('Blank lines', () => {
    let diffs: Diff[] = [
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
  })

  test('Line boundaries', () => {
    let diffs: Diff[] = [
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
  })

  test('Word boundaries', () => {
    let diffs: Diff[] = [
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
  })

  test('Alphanumeric boundaries', () => {
    let diffs: Diff[] = [
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
  })

  test('Hitting the start', () => {
    let diffs: Diff[] = [
      [DIFF_EQUAL, 'a'],
      [DIFF_DELETE, 'a'],
      [DIFF_EQUAL, 'ax'],
    ]
    diffs = cleanupSemanticLossless(diffs)
    expect(diffs).toEqual([
      [DIFF_DELETE, 'a'],
      [DIFF_EQUAL, 'aax'],
    ])
  })

  test('Hitting the end', () => {
    let diffs: Diff[] = [
      [DIFF_EQUAL, 'xa'],
      [DIFF_DELETE, 'a'],
      [DIFF_EQUAL, 'a'],
    ]
    diffs = cleanupSemanticLossless(diffs)
    expect(diffs).toEqual([
      [DIFF_EQUAL, 'xaa'],
      [DIFF_DELETE, 'a'],
    ])
  })

  test('Sentence boundaries', () => {
    let diffs: Diff[] = [
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
})
