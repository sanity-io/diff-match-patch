import {test, expect} from 'vitest'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff} from '../diff.js'
import {diffText1, diffText2} from '../diffText.js'
import {fromDelta} from '../fromDelta.js'
import {toDelta} from '../toDelta.js'

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
  let diffs: Diff[] = [
    [DIFF_EQUAL, 'jump'],
    [DIFF_DELETE, 's'],
    [DIFF_INSERT, 'ed'],
    [DIFF_EQUAL, ' over '],
    [DIFF_DELETE, 'the'],
    [DIFF_INSERT, 'a'],
    [DIFF_EQUAL, ' lazy'],
    [DIFF_INSERT, 'old dog'],
  ]
  let text1 = diffText1(diffs)
  expect(text1).toBe('jumps over the lazy')

  let delta = toDelta(diffs)
  expect(delta).toBe('=4\t-1\t+ed\t=6\t-3\t+a\t=5\t+old dog')

  // Convert delta string into a diff.
  expect(diffs).toEqual(fromDelta(text1, delta))

  // Generates error (19 !==  20).
  try {
    fromDelta(`${text1}x`, delta)
    expect(null).toBe(Error)
  } catch (e) {
    // Exception expected.
  }

  // Generates error (19 !==  18).
  expect(() => fromDelta(text1.substring(1), delta)).toThrowError(
    'Delta length (19) does not equal source text length (18)'
  )

  // Generates error (%c3%xy invalid Unicode).
  expect(() => fromDelta('', '+%c3%xy')).toThrowError('Illegal escape in fromDelta: %c3%xy')

  // Test deltas with special characters.
  diffs = [
    [DIFF_EQUAL, '\u0680 \x00 \t %'],
    [DIFF_DELETE, '\u0681 \x01 \n ^'],
    [DIFF_INSERT, '\u0682 \x02 \\ |'],
  ]
  text1 = diffText1(diffs)
  expect(text1).toBe('\u0680 \x00 \t %\u0681 \x01 \n ^')

  delta = toDelta(diffs)
  expect(delta).toBe('=7\t-7\t+%DA%82 %02 %5C %7C')

  // Convert delta string into a diff.
  expect(diffs).toEqual(fromDelta(text1, delta))

  // Verify pool of unchanged characters.
  diffs = [[DIFF_INSERT, "A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , # "]]
  const text2 = diffText2(diffs)
  expect(text2).toBe("A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , # ")

  delta = toDelta(diffs)
  expect(delta).toBe("+A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , # ")

  // Convert delta string into a diff.
  expect(diffs).toEqual(fromDelta('', delta))

  // 160 kb string.
  let a = 'abcdefghij'
  for (let i = 0; i < 14; i++) {
    a += a
  }
  diffs = [[DIFF_INSERT, a]]
  delta = toDelta(diffs)
  expect(delta).toBe(`+${a}`)
})
