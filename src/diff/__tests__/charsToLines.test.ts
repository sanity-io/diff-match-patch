import { charsToLines_ } from '../charsToLines'
import { Diff, DiffType } from '../diff'
import { linesToChars_ } from '../linesToChars'

test('charsToLines', () => {
  // Convert chars up to lines.
  let diffs: Diff[] = [
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
  let lineList = []
  const charList = []
  for (let i = 1; i < n + 1; i++) {
    lineList[i - 1] = i + '\n'
    charList[i - 1] = String.fromCharCode(i)
  }
  expect(lineList.length).toBe(n)
  const lines = lineList.join('')
  let chars = charList.join('')
  expect(chars.length).toBe(n)
  lineList.unshift('')
  diffs = [[DiffType.DELETE, chars]]
  charsToLines_(diffs, lineList)
  expect(diffs).toEqual([[DiffType.DELETE, lines]])

  // More than 65536 to verify any 16-bit limitation.
  lineList = []
  for (let i = 0; i < 66000; i++) {
    lineList[i] = i + '\n'
  }
  chars = lineList.join('')
  const results = linesToChars_(chars, '')
  diffs = [[DiffType.INSERT, results.chars1]]
  charsToLines_(diffs, results.lineArray)
  expect(diffs[0][1]).toEqual(chars)
})
