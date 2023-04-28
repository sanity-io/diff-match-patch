import {test, expect, describe} from 'vitest'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff.js'
import {xIndex} from '../xIndex.js'

// Translate a location in text1 to text2.
describe('xIndex', () => {
  test('translation on equality', () => {
    expect(
      xIndex(
        [
          [DIFF_DELETE, 'a'],
          [DIFF_INSERT, '1234'],
          [DIFF_EQUAL, 'xyz'],
        ],
        2
      )
    ).toEqual(5)
  })

  test('translation on deletion', () => {
    expect(
      xIndex(
        [
          [DIFF_EQUAL, 'a'],
          [DIFF_DELETE, '1234'],
          [DIFF_EQUAL, 'xyz'],
        ],
        3
      )
    ).toEqual(1)
  })
})
