import {describe, expect, test} from 'vitest'

import {cleanupSemantic} from '../cleanup.js'
import {type Diff, DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff.js'

describe('cleanupSemantic', () => {
  test('Null case', () => {
    let diffs: Diff[] = []
    diffs = cleanupSemantic(diffs)
    expect(diffs).toEqual([])
  })

  test('No elimination #1', () => {
    let diffs: Diff[] = [
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
  })

  test('No elimination #2', () => {
    let diffs: Diff[] = [
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
  })

  test('Simple elimination', () => {
    let diffs: Diff[] = [
      [DIFF_DELETE, 'a'],
      [DIFF_EQUAL, 'b'],
      [DIFF_DELETE, 'c'],
    ]
    diffs = cleanupSemantic(diffs)
    expect(diffs).toEqual([
      [DIFF_DELETE, 'abc'],
      [DIFF_INSERT, 'b'],
    ])
  })

  test('Backpass elimination', () => {
    let diffs: Diff[] = [
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
  })

  test('Multiple eliminations', () => {
    let diffs: Diff[] = [
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
  })

  test('Word boundaries', () => {
    let diffs: Diff[] = [
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
  })

  test('No overlap elimination', () => {
    let diffs: Diff[] = [
      [DIFF_DELETE, 'abcxx'],
      [DIFF_INSERT, 'xxdef'],
    ]
    diffs = cleanupSemantic(diffs)
    expect(diffs).toEqual([
      [DIFF_DELETE, 'abcxx'],
      [DIFF_INSERT, 'xxdef'],
    ])
  })

  test('Overlap elimination', () => {
    let diffs: Diff[] = [
      [DIFF_DELETE, 'abcxxx'],
      [DIFF_INSERT, 'xxxdef'],
    ]
    diffs = cleanupSemantic(diffs)
    expect(diffs).toEqual([
      [DIFF_DELETE, 'abc'],
      [DIFF_EQUAL, 'xxx'],
      [DIFF_INSERT, 'def'],
    ])
  })

  test('Reverse overlap elimination', () => {
    let diffs: Diff[] = [
      [DIFF_DELETE, 'xxxabc'],
      [DIFF_INSERT, 'defxxx'],
    ]
    diffs = cleanupSemantic(diffs)
    expect(diffs).toEqual([
      [DIFF_INSERT, 'def'],
      [DIFF_EQUAL, 'xxx'],
      [DIFF_DELETE, 'abc'],
    ])
  })

  test('Two overlap eliminations', () => {
    let diffs: Diff[] = [
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
})
