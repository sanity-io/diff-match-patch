import { DiffType } from '../diff'
import { levenshtein } from '../levenshtein'

test('levenshtein', () => {
  // Levenshtein with trailing equality.
  expect(
    levenshtein([
      [DiffType.DELETE, 'abc'],
      [DiffType.INSERT, '1234'],
      [DiffType.EQUAL, 'xyz'],
    ]),
  ).toBe(4)
  // Levenshtein with leading equality.
  expect(
    levenshtein([
      [DiffType.EQUAL, 'xyz'],
      [DiffType.DELETE, 'abc'],
      [DiffType.INSERT, '1234'],
    ]),
  ).toBe(4)

  // Levenshtein with middle equality.
  expect(
    levenshtein([
      [DiffType.DELETE, 'abc'],
      [DiffType.EQUAL, 'xyz'],
      [DiffType.INSERT, '1234'],
    ]),
  ).toBe(7)
})
