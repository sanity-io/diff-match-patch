import { parse } from '../parse'
import { stringifyPatch } from '../stringify'

test('fromText', () => {
  expect(parse('')).toEqual([])

  const strp =
    '@@ -21,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n %0Alaz\n'
  expect(stringifyPatch(parse(strp)[0])).toBe(strp)

  expect(stringifyPatch(parse('@@ -1 +1 @@\n-a\n+b\n')[0])).toBe(
    '@@ -1 +1 @@\n-a\n+b\n',
  )

  expect(stringifyPatch(parse('@@ -1,3 +0,0 @@\n-abc\n')[0])).toBe(
    '@@ -1,3 +0,0 @@\n-abc\n',
  )

  expect(stringifyPatch(parse('@@ -0,0 +1,3 @@\n+abc\n')[0])).toBe(
    '@@ -0,0 +1,3 @@\n+abc\n',
  )

  // Generates error.
  expect(() => parse('Bad\nPatch\n')).toThrowError(/invalid patch/i)
})
