import {test, expect} from 'vitest'
import {commonSuffix} from '../commonSuffix.js'

test('commonSuffix', () => {
  // Detect any common suffix.
  // Null case.
  expect(commonSuffix('abc', 'xyz')).toBe(0)

  // Non-null case.
  expect(commonSuffix('abcdef1234', 'xyz1234')).toBe(4)

  // Whole case.
  expect(commonSuffix('1234', 'xyz1234')).toBe(4)
})
