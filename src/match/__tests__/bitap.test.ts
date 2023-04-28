import {test, expect, describe} from 'vitest'
import {bitap} from '../bitap.js'

// Bitap algorithm.
describe('bitap', () => {
  const options = {distance: 100, threshold: 0.5}

  test('Exact matches', () => {
    expect(bitap('abcdefghijk', 'fgh', 5, options)).toEqual(5)
    expect(bitap('abcdefghijk', 'fgh', 0, options)).toEqual(5)
    expect(bitap('abcdefghijk', 'efxhi', 0, options)).toEqual(4)
  })

  test('Fuzzy matches', () => {
    expect(bitap('abcdefghijk', 'cdefxyhijk', 5, options)).toEqual(2)
    expect(bitap('abcdefghijk', 'bxy', 1, options)).toEqual(-1)
    expect(bitap('123456789xx0', '3456789x0', 2, options)).toEqual(2)
  })

  test('Overflow: Threshold', () => {
    expect(bitap('abcdefghijk', 'efxyhi', 1, {...options, threshold: 0.4})).toBe(4)
    expect(bitap('abcdefghijk', 'efxyhi', 1, {...options, threshold: 0.3})).toBe(-1)
    expect(bitap('abcdefghijk', 'bcdef', 1, {...options, threshold: 0})).toBe(1)
  })

  test('Multiple select', () => {
    expect(bitap('abcdexyzabcde', 'abccde', 3, options)).toEqual(0)
    expect(bitap('abcdexyzabcde', 'abccde', 5, options)).toEqual(8)
  })

  test('Distance test: Strict location, long', () => {
    expect(
      bitap('abcdefghijklmnopqrstuvwxyz', 'abcdefg', 24, {
        ...options,
        distance: 10, // Strict location.
      })
    ).toEqual(-1)
  })

  test('Distance test: Strict location, short', () => {
    expect(
      bitap('abcdefghijklmnopqrstuvwxyz', 'abcdxxefg', 1, {
        ...options,
        distance: 10, // Strict location.
      })
    ).toEqual(0)
  })

  test('Distance test: Loose location', () => {
    expect(
      bitap('abcdefghijklmnopqrstuvwxyz', 'abcdefg', 24, {
        ...options,
        distance: 1000, // Loose location.
      })
    ).toEqual(0)
  })
})
