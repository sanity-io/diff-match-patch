import {describe, expect,test} from 'vitest'

import {type Diff,diff, DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff.js'

// Perform a trivial diff.
describe('diff', () => {
  test('Null case', () => {
    expect(diff('', '', {checkLines: false})).toEqual([])
  })

  test('Equality', () => {
    expect(diff('abc', 'abc', {checkLines: false})).toEqual([[DIFF_EQUAL, 'abc']])
  })

  test('Simple insertion', () => {
    expect(diff('abc', 'ab123c', {checkLines: false})).toEqual([
      [DIFF_EQUAL, 'ab'],
      [DIFF_INSERT, '123'],
      [DIFF_EQUAL, 'c'],
    ])
  })

  test('Simple deletion', () => {
    expect(diff('a123bc', 'abc', {checkLines: false})).toEqual([
      [DIFF_EQUAL, 'a'],
      [DIFF_DELETE, '123'],
      [DIFF_EQUAL, 'bc'],
    ])
  })

  test('Two insertions', () => {
    expect(diff('abc', 'a123b456c', {checkLines: false})).toEqual([
      [DIFF_EQUAL, 'a'],
      [DIFF_INSERT, '123'],
      [DIFF_EQUAL, 'b'],
      [DIFF_INSERT, '456'],
      [DIFF_EQUAL, 'c'],
    ])
  })

  test('Two deletions', () => {
    expect(diff('a123b456c', 'abc', {checkLines: false})).toEqual([
      [DIFF_EQUAL, 'a'],
      [DIFF_DELETE, '123'],
      [DIFF_EQUAL, 'b'],
      [DIFF_DELETE, '456'],
      [DIFF_EQUAL, 'c'],
    ])
  })

  test('no timeout', () => {
    expect(diff('a', 'b', {checkLines: false, timeout: 0})).toEqual([
      [DIFF_DELETE, 'a'],
      [DIFF_INSERT, 'b'],
    ])
  })

  test('simple cases', () => {
    expect(
      diff('Apples are a fruit.', 'Bananas are also fruit.', {
        checkLines: false,
      }),
    ).toEqual([
      [DIFF_DELETE, 'Apple'],
      [DIFF_INSERT, 'Banana'],
      [DIFF_EQUAL, 's are a'],
      [DIFF_INSERT, 'lso'],
      [DIFF_EQUAL, ' fruit.'],
    ])

    expect(diff('ax\t', '\u0680x\0', {checkLines: false})).toEqual([
      [DIFF_DELETE, 'a'],
      [DIFF_INSERT, '\u0680'],
      [DIFF_EQUAL, 'x'],
      [DIFF_DELETE, '\t'],
      [DIFF_INSERT, '\0'],
    ])
  })

  test('Overlaps', () => {
    expect(diff('1ayb2', 'abxab', {checkLines: false})).toEqual([
      [DIFF_DELETE, '1'],
      [DIFF_EQUAL, 'a'],
      [DIFF_DELETE, 'y'],
      [DIFF_EQUAL, 'b'],
      [DIFF_DELETE, '2'],
      [DIFF_INSERT, 'xab'],
    ])

    expect(diff('abcy', 'xaxcxabc', {checkLines: false})).toEqual([
      [DIFF_INSERT, 'xaxcx'],
      [DIFF_EQUAL, 'abc'],
      [DIFF_DELETE, 'y'],
    ])

    expect([
      [DIFF_DELETE, 'ABCD'],
      [DIFF_EQUAL, 'a'],
      [DIFF_DELETE, '='],
      [DIFF_INSERT, '-'],
      [DIFF_EQUAL, 'bcd'],
      [DIFF_DELETE, '='],
      [DIFF_INSERT, '-'],
      [DIFF_EQUAL, 'efghijklmnopqrs'],
      [DIFF_DELETE, 'EFGHIJKLMNOefg'],
    ]).toEqual(
      diff('ABCDa=bcd=efghijklmnopqrsEFGHIJKLMNOefg', 'a-bcd-efghijklmnopqrs', {
        checkLines: false,
      }),
    )
  })

  test('Large equality', () => {
    expect(
      diff('a [[Pennsylvania]] and [[New', ' and [[Pennsylvania]]', {
        checkLines: false,
      }),
    ).toEqual([
      [DIFF_INSERT, ' '],
      [DIFF_EQUAL, 'a'],
      [DIFF_INSERT, 'nd'],
      [DIFF_EQUAL, ' [[Pennsylvania]]'],
      [DIFF_DELETE, ' and [[New'],
    ])
  })

  test('larger (reaches timeout)', () => {
    let a =
      '`Twas brillig, and the slithy toves\nDid gyre and gimble in the wabe:\nAll mimsy were the borogoves,\nAnd the mome raths outgrabe.\n'
    let b =
      "I am the very model of a modern major general,\nI've information vegetable, animal, and mineral,\nI know the kings of England, and I quote the fights historical,\nFrom Marathon to Waterloo, in order categorical.\n"

    // Increase the text lengths by 1024 times to ensure a timeout.
    for (let x = 0; x < 10; x++) {
      a += a
      b += b
    }

    const start = Date.now()
    diff(a, b)

    // Default timeout is 1s
    expect(Date.now() - start).toBeGreaterThanOrEqual(1000)
  })

  test('linemode speedup', () => {
    // Must be long to pass the 100 char cutoff.
    const a =
      '1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n'
    const b =
      'abcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\n'

    // Simple line-mode.
    expect(diff(a, b, {checkLines: false})).toEqual(diff(a, b, {checkLines: true}))
  })

  test('single line mode', () => {
    const a =
      '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
    const b =
      'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij'

    expect(diff(a, b, {checkLines: true})).toEqual(diff(a, b, {checkLines: false}))
  })

  test('overlap line-mode', () => {
    const a =
      '1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n'
    const b =
      'abcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n'
    const textsLinemode = diffRebuildsText(diff(a, b, {checkLines: true}))
    const textsTextmode = diffRebuildsText(diff(a, b, {checkLines: false}))
    expect(textsLinemode).toEqual(textsTextmode)
  })

  test('null inputs', () => {
    // Test null inputs.
    expect(() => diff(null, null)).toThrowError(/null input/i)
  })
})

function diffRebuildsText(diffs: Diff[]) {
  // Construct the two texts which made up the diff originally.
  let text1 = ''
  let text2 = ''

  for (const [op, text] of diffs) {
    if (op !== DIFF_INSERT) {
      text1 += text
    }

    if (op !== DIFF_DELETE) {
      text2 += text
    }
  }

  return [text1, text2]
}
