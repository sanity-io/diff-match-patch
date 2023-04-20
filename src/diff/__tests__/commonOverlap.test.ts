import {test, expect} from 'vitest'
import {commonOverlap_} from '../commonOverlap.js'

test('commonOverLap', () => {
  // Detect any suffix/prefix overlap.
  // Null case.
  expect(commonOverlap_('', 'abcd')).toBe(0)

  // Whole case.
  expect(commonOverlap_('abc', 'abcd')).toBe(3)

  // No overlap.
  expect(commonOverlap_('123456', 'abcd')).toBe(0)
  //
  // // Overlap.
  expect(commonOverlap_('123456xxx', 'xxxabcd')).toBe(3)
  //
  // // Unicode.
  // // Some overly clever languages (C#) may treat ligatures as equal to their
  // // component letters.  E.g. U+FB01 === 'fi'
  expect(commonOverlap_('fi', '\ufb01i')).toBe(0)
})
