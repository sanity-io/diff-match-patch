import {test, expect} from 'vitest'
import {diff, DiffType} from '../../diff/diff.js'
import {make} from '../make.js'
import {parse} from '../parse.js'
import {stringify} from '../stringify.js'

test('make', () => {
  // Null case.
  let patches = make('', '')
  expect(stringify(patches)).toBe('')

  let text1 = 'The quick brown fox jumps over the lazy dog.'
  let text2 = 'That quick brown fox jumped over a lazy dog.'
  // Text2+Text1 inputs.
  let expectedPatch =
    '@@ -1,8 +1,7 @@\n Th\n-at\n+e\n  qui\n@@ -21,17 +21,18 @@\n jump\n-ed\n+s\n  over \n-a\n+the\n  laz\n'
  // The second patch must be "-21,17 +21,18", not "-22,17 +21,18" due to rolling context.
  patches = make(text2, text1)
  expect(stringify(patches)).toBe(expectedPatch)

  // Text1+Text2 inputs.
  expectedPatch =
    '@@ -1,11 +1,12 @@\n Th\n-e\n+at\n  quick b\n@@ -22,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n  laz\n'
  patches = make(text1, text2)
  expect(stringify(patches)).toBe(expectedPatch)

  // Diff input.
  let diffs = diff(text1, text2, {checkLines: false})
  patches = make(diffs)
  expect(stringify(patches)).toBe(expectedPatch)

  // Text1+Diff inputs.
  patches = make(text1, diffs)
  expect(stringify(patches)).toBe(expectedPatch)

  // Character encoding.
  patches = make("`1234567890-=[]\\;',./", '~!@#$%^&*()_+{}|:"<>?')
  expect(stringify(patches)).toBe(
    "@@ -1,21 +1,21 @@\n-%601234567890-=%5B%5D%5C;',./\n+~!@#$%25%5E&*()_+%7B%7D%7C:%22%3C%3E?\n"
  )

  // Character decoding.
  diffs = [
    [DiffType.DELETE, "`1234567890-=[]\\;',./"],
    [DiffType.INSERT, '~!@#$%^&*()_+{}|:"<>?'],
  ]
  expect(diffs).toEqual(
    parse(
      "@@ -1,21 +1,21 @@\n-%601234567890-=%5B%5D%5C;',./\n+~!@#$%25%5E&*()_+%7B%7D%7C:%22%3C%3E?\n"
    )[0].diffs
  )

  // Long string with repeats.
  text1 = ''
  for (let x = 0; x < 100; x++) {
    text1 += 'abcdef'
  }
  text2 = `${text1}123`
  expectedPatch = '@@ -573,28 +573,31 @@\n cdefabcdefabcdefabcdefabcdef\n+123\n'
  patches = make(text1, text2)
  expect(stringify(patches)).toBe(expectedPatch)

  // Test null inputs.
  // @ts-expect-error
  expect(() => make(null)).toThrowError(/unknown call format/i)
})
