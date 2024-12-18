import {describe, test, expect} from 'vitest'
import {DIFF_DELETE, DIFF_INSERT, diff} from '../../diff/diff.js'
import {make} from '../make.js'
import {parse} from '../parse.js'
import {stringify} from '../stringify.js'

describe('make', () => {
  const text1 = 'The quick brown fox jumps over the lazy dog.'
  const text2 = 'That quick brown fox jumped over a lazy dog.'

  test('Null case', () => {
    const patches = make('', '')
    expect(stringify(patches)).toBe('')
  })

  test('Text2+Text1 inputs', () => {
    const expectedPatch =
      '@@ -1,8 +1,7 @@\n Th\n-at\n+e\n  qui\n@@ -21,17 +21,18 @@\n jump\n-ed\n+s\n  over \n-a\n+the\n  laz\n'

    // The second patch must be "-21,17 +21,18", not "-22,17 +21,18" due to rolling context.
    const patches = make(text2, text1)
    expect(stringify(patches)).toBe(expectedPatch)
  })

  test('Text1+Text2 inputs', () => {
    const expectedPatch =
      '@@ -1,11 +1,12 @@\n Th\n-e\n+at\n  quick b\n@@ -22,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n  laz\n'
    const patches = make(text1, text2)
    expect(stringify(patches)).toBe(expectedPatch)
  })

  test('Diff input', () => {
    const expectedPatch =
      '@@ -1,11 +1,12 @@\n Th\n-e\n+at\n  quick b\n@@ -22,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n  laz\n'
    const diffs = diff(text1, text2, {checkLines: false})
    const patches = make(diffs)
    expect(stringify(patches)).toBe(expectedPatch)
  })

  test('Text1+Diff inputs', () => {
    const expectedPatch =
      '@@ -1,11 +1,12 @@\n Th\n-e\n+at\n  quick b\n@@ -22,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n  laz\n'
    const diffs = diff(text1, text2, {checkLines: false})
    const patches = make(text1, diffs)
    expect(stringify(patches)).toBe(expectedPatch)
  })

  test('Character encoding', () => {
    const patches = make("`1234567890-=[]\\;',./", '~!@#$%^&*()_+{}|:"<>?')
    expect(stringify(patches)).toBe(
      "@@ -1,21 +1,21 @@\n-%601234567890-=%5B%5D%5C;',./\n+~!@#$%25%5E&*()_+%7B%7D%7C:%22%3C%3E?\n",
    )
  })

  test('Character decoding', () => {
    const diffs = [
      [DIFF_DELETE, "`1234567890-=[]\\;',./"],
      [DIFF_INSERT, '~!@#$%^&*()_+{}|:"<>?'],
    ]
    expect(diffs).toEqual(
      parse(
        "@@ -1,21 +1,21 @@\n-%601234567890-=%5B%5D%5C;',./\n+~!@#$%25%5E&*()_+%7B%7D%7C:%22%3C%3E?\n",
      )[0].diffs,
    )
  })

  test('Unicode character encoding', () => {
    const patches = make('Dette blir gøy.', 'Dette blir kjipt.')
    expect(stringify(patches)).toMatchInlineSnapshot(`
      "@@ -8,9 +8,10 @@
       lir 
      -g%C3%B8y
      +kjipt
       .
      "
    `)
  })

  test('Long string with repeats', () => {
    let textA = ''
    for (let x = 0; x < 100; x++) {
      textA += 'abcdef'
    }
    const textB = `${textA}123`
    const expectedPatch = '@@ -573,28 +573,31 @@\n cdefabcdefabcdefabcdefabcdef\n+123\n'
    const patches = make(textA, textB)
    expect(stringify(patches)).toBe(expectedPatch)
  })

  test('Test null inputs', () => {
    // @ts-expect-error
    expect(() => make(null)).toThrowError(/unknown call format/i)
  })
})
