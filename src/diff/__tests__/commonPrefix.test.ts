import {describe, expect, test} from 'vitest'

import {getCommonPrefix} from '../commonPrefix.js'

// Detect any common prefix.
describe('commonPrefix', () => {
  test('Null case', () => {
    expect(getCommonPrefix('abc', 'xyz')).toBe(0)
  })

  test('Non-null case', () => {
    expect(getCommonPrefix('1234abcdef', '1234xyz')).toBe(4)
  })

  test('Whole case', () => {
    expect(getCommonPrefix('1234', '1234xyz')).toBe(4)
  })
})
