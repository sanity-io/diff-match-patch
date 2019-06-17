import { alphabet_, bitap_ } from '../bitap'

test('bitap', () => {
  // Bitap algorithm.
  const options = { distance: 100, threshold: 0.5 }
  expect(bitap_('abcdefghijk', 'fgh', 5, options)).toEqual(5)
  // Exact matches.
  expect(bitap_('abcdefghijk', 'fgh', 0, options)).toEqual(5)

  expect(bitap_('abcdefghijk', 'efxhi', 0, options)).toEqual(4)
  // Fuzzy matches.
  expect(bitap_('abcdefghijk', 'cdefxyhijk', 5, options)).toEqual(2)

  expect(bitap_('abcdefghijk', 'bxy', 1, options)).toEqual(-1)

  expect(bitap_('123456789xx0', '3456789x0', 2, options)).toEqual(2)

  // Overflow.
  // Threshold test.
  expect(
    bitap_('abcdefghijk', 'efxyhi', 1, { ...options, threshold: 0.4 }),
  ).toBe(4)
  expect(
    bitap_('abcdefghijk', 'efxyhi', 1, { ...options, threshold: 0.3 }),
  ).toBe(-1)
  expect(bitap_('abcdefghijk', 'bcdef', 1, { ...options, threshold: 0 })).toBe(
    1,
  )
  // Multiple select.
  expect(bitap_('abcdexyzabcde', 'abccde', 3, options)).toEqual(0)

  expect(bitap_('abcdexyzabcde', 'abccde', 5, options)).toEqual(8)

  // Distance test.
  expect(
    bitap_('abcdefghijklmnopqrstuvwxyz', 'abcdefg', 24, {
      ...options,
      distance: 10, // Strict location.
    }),
  ).toEqual(-1)

  expect(
    bitap_('abcdefghijklmnopqrstuvwxyz', 'abcdxxefg', 1, {
      ...options,
      distance: 10, // Strict location.
    }),
  ).toEqual(0)

  expect(
    bitap_('abcdefghijklmnopqrstuvwxyz', 'abcdefg', 24, {
      ...options,
      distance: 1000, // Loose location.
    }),
  ).toEqual(0)
})

test('alphabet', () => {
  // Initialise the bitmasks for Bitap.
  // Unique.
  expect(alphabet_('abc')).toEqual({ a: 4, b: 2, c: 1 })

  // Duplicates.
  expect(alphabet_('abcaba')).toEqual({ a: 37, b: 18, c: 8 })
})
