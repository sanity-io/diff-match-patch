import {test, expect} from 'vitest'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff.js'
import {levenshtein} from '../levenshtein.js'

test('levenshtein', () => {
  // Levenshtein with trailing equality.
  expect(
    levenshtein([
      [DIFF_DELETE, 'abc'],
      [DIFF_INSERT, '1234'],
      [DIFF_EQUAL, 'xyz'],
    ])
  ).toBe(4)
  // Levenshtein with leading equality.
  expect(
    levenshtein([
      [DIFF_EQUAL, 'xyz'],
      [DIFF_DELETE, 'abc'],
      [DIFF_INSERT, '1234'],
    ])
  ).toBe(4)

  // Levenshtein with middle equality.
  expect(
    levenshtein([
      [DIFF_DELETE, 'abc'],
      [DIFF_EQUAL, 'xyz'],
      [DIFF_INSERT, '1234'],
    ])
  ).toBe(7)
})
