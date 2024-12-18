import {describe,expect, test} from 'vitest'

import {getCommonOverlap} from '../commonOverlap.js'

// Detect any suffix/prefix overlap.
describe('commonOverLap', () => {
  test('Null case', () => {
    expect(getCommonOverlap('', 'abcd')).toBe(0)
  })

  test('Whole case', () => {
    expect(getCommonOverlap('abc', 'abcd')).toBe(3)
  })

  test('No overlap', () => {
    expect(getCommonOverlap('123456', 'abcd')).toBe(0)
  })

  test('Overlap', () => {
    expect(getCommonOverlap('123456xxx', 'xxxabcd')).toBe(3)
  })

  // Some overly clever languages (C#) may treat ligatures as equal to their
  // component letters.  E.g. U+FB01 === 'fi'
  test('Unicode', () => {
    expect(getCommonOverlap('fi', '\ufb01i')).toBe(0)
  })
})
