import { Diff, DiffType } from '../diff'
import { charsToLines_ } from '../charsToLines'

test('charsToLines', () => {
  // Convert chars up to lines.
  const diffs: Diff[] = [
    [DiffType.EQUAL, '\x01\x02\x01'],
    [DiffType.INSERT, '\x02\x01\x02'],
  ]
  charsToLines_(diffs, ['', 'alpha\n', 'beta\n'])
  expect(diffs).toEqual([
    [DiffType.EQUAL, 'alpha\nbeta\nalpha\n'],
    [DiffType.INSERT, 'beta\nalpha\nbeta\n'],
  ])

  // More than 256 to reveal any 8-bit limitations.
  const n = 300
  const lineList = []
  const charList = []
  for (let x = 1; x < n + 1; x++) {
    lineList[x - 1] = x + '\n'
    charList[x - 1] = String.fromCharCode(x)
  }
  expect(lineList.length).toBe(n)
  const lines = lineList.join('')
  const chars = charList.join('')
  expect(chars.length).toBe(n)
  lineList.unshift('')
  const diffs2: Diff[] = [[DiffType.DELETE, chars]]
  charsToLines_(diffs2, lineList)
  expect(diffs2).toEqual([[DiffType.DELETE, lines]])
})
