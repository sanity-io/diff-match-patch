import { commonPrefix } from '../commonPrefix.js'

test('commonPrefix', () => {
  // Detect any common prefix.
  // Null case.
  expect(commonPrefix('abc', 'xyz')).toBe(0)

  // Non-null case.
  expect(commonPrefix('1234abcdef', '1234xyz')).toBe(4)

  // Whole case.
  expect(commonPrefix('1234', '1234xyz')).toBe(4)
})
