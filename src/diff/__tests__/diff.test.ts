import { Diff, diff, DiffType } from '../diff'

test('diff', () => {
  // Perform a trivial diff.
  // Null case.
  expect(diff('', '', { checkLines: false })).toEqual([])

  // Equality.
  expect(diff('abc', 'abc', { checkLines: false })).toEqual([
    [DiffType.EQUAL, 'abc'],
  ])

  // Simple insertion.
  expect(diff('abc', 'ab123c', { checkLines: false })).toEqual([
    [DiffType.EQUAL, 'ab'],
    [DiffType.INSERT, '123'],
    [DiffType.EQUAL, 'c'],
  ])

  // Simple deletion.
  expect(diff('a123bc', 'abc', { checkLines: false })).toEqual([
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, '123'],
    [DiffType.EQUAL, 'bc'],
  ])

  // Two insertions.
  expect(diff('abc', 'a123b456c', { checkLines: false })).toEqual([
    [DiffType.EQUAL, 'a'],
    [DiffType.INSERT, '123'],
    [DiffType.EQUAL, 'b'],
    [DiffType.INSERT, '456'],
    [DiffType.EQUAL, 'c'],
  ])

  // Two deletions.
  expect(diff('a123b456c', 'abc', { checkLines: false })).toEqual([
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, '123'],
    [DiffType.EQUAL, 'b'],
    [DiffType.DELETE, '456'],
    [DiffType.EQUAL, 'c'],
  ])

  // Perform a real diff.
  // switch off timeut
  // Simple cases.
  expect(diff('a', 'b', { checkLines: false, timeout: 0 })).toEqual([
    [DiffType.DELETE, 'a'],
    [DiffType.INSERT, 'b'],
  ])

  expect(
    diff('Apples are a fruit.', 'Bananas are also fruit.', {
      checkLines: false,
    }),
  ).toEqual([
    [DiffType.DELETE, 'Apple'],
    [DiffType.INSERT, 'Banana'],
    [DiffType.EQUAL, 's are a'],
    [DiffType.INSERT, 'lso'],
    [DiffType.EQUAL, ' fruit.'],
  ])

  expect(diff('ax\t', '\u0680x\0', { checkLines: false })).toEqual([
    [DiffType.DELETE, 'a'],
    [DiffType.INSERT, '\u0680'],
    [DiffType.EQUAL, 'x'],
    [DiffType.DELETE, '\t'],
    [DiffType.INSERT, '\0'],
  ])

  // Overlaps.
  expect(diff('1ayb2', 'abxab', { checkLines: false })).toEqual([
    [DiffType.DELETE, '1'],
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 'y'],
    [DiffType.EQUAL, 'b'],
    [DiffType.DELETE, '2'],
    [DiffType.INSERT, 'xab'],
  ])

  expect(diff('abcy', 'xaxcxabc', { checkLines: false })).toEqual([
    [DiffType.INSERT, 'xaxcx'],
    [DiffType.EQUAL, 'abc'],
    [DiffType.DELETE, 'y'],
  ])

  expect([
    [DiffType.DELETE, 'ABCD'],
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, '='],
    [DiffType.INSERT, '-'],
    [DiffType.EQUAL, 'bcd'],
    [DiffType.DELETE, '='],
    [DiffType.INSERT, '-'],
    [DiffType.EQUAL, 'efghijklmnopqrs'],
    [DiffType.DELETE, 'EFGHIJKLMNOefg'],
  ]).toEqual(
    diff('ABCDa=bcd=efghijklmnopqrsEFGHIJKLMNOefg', 'a-bcd-efghijklmnopqrs', {
      checkLines: false,
    }),
  )

  // Large equality.
  expect(
    diff('a [[Pennsylvania]] and [[New', ' and [[Pennsylvania]]', {
      checkLines: false,
    }),
  ).toEqual([
    [DiffType.INSERT, ' '],
    [DiffType.EQUAL, 'a'],
    [DiffType.INSERT, 'nd'],
    [DiffType.EQUAL, ' [[Pennsylvania]]'],
    [DiffType.DELETE, ' and [[New'],
  ])

  let a =
    '`Twas brillig, and the slithy toves\nDid gyre and gimble in the wabe:\nAll mimsy were the borogoves,\nAnd the mome raths outgrabe.\n'
  let b =
    "I am the very model of a modern major general,\nI've information vegetable, animal, and mineral,\nI know the kings of England, and I quote the fights historical,\nFrom Marathon to Waterloo, in order categorical.\n"
  // Increase the text lengths by 1024 times to ensure a timeout.
  for (let x = 0; x < 10; x++) {
    a = a + a
    b = b + b
  }
  diff(a, b)
  // Test that we took at least the timeout period.
  // Test that we didn't take forever (be forgiving).
  // Theoretically this test could fail very occasionally if the
  // OS task swaps or locks up for a second at the wrong moment.
  // ****
  // TODO(fraser): For unknown reasons this is taking 500 ms on Google's
  // internal test system.  Whereas browsers take 140 ms.
  // assertTrue(dmp.Diff_Timeout * 1000 * 2 > endTime - startTime);
  // ****

  // Test the linemode speedup.
  // Must be long to pass the 100 char cutoff.
  // Simple line-mode.
  a =
    '1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n'
  b =
    'abcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\n'

  expect(diff(a, b, { checkLines: false })).toEqual(
    diff(a, b, { checkLines: true }),
  )

  // Single line-mode.
  a =
    '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
  b =
    'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij'

  expect(diff(a, b, { checkLines: true })).toEqual(
    diff(a, b, { checkLines: false }),
  )

  // Overlap line-mode.
  a =
    '1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n'
  b =
    'abcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n'
  const textsLinemode = diff_rebuildtexts(diff(a, b, { checkLines: true }))
  const textsTextmode = diff_rebuildtexts(diff(a, b, { checkLines: false }))
  expect(textsLinemode).toEqual(textsTextmode)

  // Test null inputs.
  expect(() => diff(null, null)).toThrowError(/null input/i)
})

function diff_rebuildtexts(diffs: Diff[]) {
  // Construct the two texts which made up the diff originally.
  let text1 = ''
  let text2 = ''
  // tslint:disable-next-line:prefer-for-of
  for (let x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DiffType.INSERT) {
      text1 += diffs[x][1]
    }
    if (diffs[x][0] !== DiffType.DELETE) {
      text2 += diffs[x][1]
    }
  }
  return [text1, text2]
}
