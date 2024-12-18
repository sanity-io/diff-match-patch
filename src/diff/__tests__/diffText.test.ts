import {describe, expect, test} from 'vitest'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, type Diff} from '../diff.js'
import {diffText1, diffText2} from '../diffText.js'
import {fromDelta} from '../fromDelta.js'
import {toDelta} from '../toDelta.js'

describe('diffText', () => {
  test('diffText1, diffText2', () => {
    // Compute the source and destination texts.
    const diffs: Diff[] = [
      [DIFF_EQUAL, 'jump'],
      [DIFF_DELETE, 's'],
      [DIFF_INSERT, 'ed'],
      [DIFF_EQUAL, ' over '],
      [DIFF_DELETE, 'the'],
      [DIFF_INSERT, 'a'],
      [DIFF_EQUAL, ' lazy'],
    ]
    expect(diffText1(diffs)).toBe('jumps over the lazy')
    expect(diffText2(diffs)).toBe('jumped over a lazy')
  })

  test('delta', () => {
    // Convert a diff into delta string.
    const diffs: Diff[] = [
      [DIFF_EQUAL, 'jump'],
      [DIFF_DELETE, 's'],
      [DIFF_INSERT, 'ed'],
      [DIFF_EQUAL, ' over '],
      [DIFF_DELETE, 'the'],
      [DIFF_INSERT, 'a'],
      [DIFF_EQUAL, ' lazy'],
      [DIFF_INSERT, 'old dog'],
    ]
    const text1 = diffText1(diffs)
    expect(text1).toBe('jumps over the lazy')

    const delta = toDelta(diffs)
    expect(delta).toBe('=4\t-1\t+ed\t=6\t-3\t+a\t=5\t+old dog')

    // Convert delta string into a diff.
    expect(diffs).toEqual(fromDelta(text1, delta))

    // Generates error (19 !==  20).
    expect(() => fromDelta(`${text1}x`, delta)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Delta length (19) does not equal source text length (20)]`,
    )

    // Generates error (19 !==  18).
    expect(() => fromDelta(text1.substring(1), delta)).toThrowError(
      'Delta length (19) does not equal source text length (18)',
    )

    // Generates error (%c3%xy invalid Unicode).
    expect(() => fromDelta('', '+%c3%xy')).toThrowError('Illegal escape in fromDelta: %c3%xy')
  })

  test('deltas with special characters', () => {
    const diffs: Diff[] = [
      [DIFF_EQUAL, '\u0680 \x00 \t %'],
      [DIFF_DELETE, '\u0681 \x01 \n ^'],
      [DIFF_INSERT, '\u0682 \x02 \\ |'],
    ]
    const text1 = diffText1(diffs)
    expect(text1).toBe('\u0680 \x00 \t %\u0681 \x01 \n ^')

    const delta = toDelta(diffs)
    expect(delta).toBe('=7\t-7\t+%DA%82 %02 %5C %7C')

    // Convert delta string into a diff.
    expect(diffs).toEqual(fromDelta(text1, delta))
  })

  test('pool of unchanged characters', () => {
    // Verify pool of unchanged characters.
    const diffs: Diff[] = [[DIFF_INSERT, "A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , # "]]
    const text2 = diffText2(diffs)
    expect(text2).toBe("A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , # ")

    const delta = toDelta(diffs)
    expect(delta).toBe("+A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , # ")

    // Convert delta string into a diff.
    expect(diffs).toEqual(fromDelta('', delta))
  })

  test('160 kb string', () => {
    let a = 'abcdefghij'
    for (let i = 0; i < 14; i++) {
      a += a
    }
    const diffs: Diff[] = [[DIFF_INSERT, a]]
    const delta = toDelta(diffs)
    expect(delta).toBe(`+${a}`)
  })
})
