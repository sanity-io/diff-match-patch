import {describe, expect,test} from 'vitest'

import {getCommonSuffix} from '../commonSuffix.js'

// Detect any common suffix.
describe('commonSuffix', () => {
  test('Null case', () => {
    expect(getCommonSuffix('abc', 'xyz')).toBe(0)
  })

  test('Non-null case', () => {
    expect(getCommonSuffix('abcdef1234', 'xyz1234')).toBe(4)
  })

  test('Whole case', () => {
    expect(getCommonSuffix('1234', 'xyz1234')).toBe(4)
  })
})
