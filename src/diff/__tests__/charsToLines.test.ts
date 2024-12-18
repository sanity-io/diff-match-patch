import {describe, expect,test} from 'vitest'

import {charsToLines} from '../charsToLines.js'
import {Diff,DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff.js'
import {linesToChars} from '../linesToChars.js'

// Convert chars up to lines.
describe('charsToLines', () => {
  test('basic', () => {
    const diffs: Diff[] = [
      [DIFF_EQUAL, '\x01\x02\x01'],
      [DIFF_INSERT, '\x02\x01\x02'],
    ]
    charsToLines(diffs, ['', 'alpha\n', 'beta\n'])
    expect(diffs).toEqual([
      [DIFF_EQUAL, 'alpha\nbeta\nalpha\n'],
      [DIFF_INSERT, 'beta\nalpha\nbeta\n'],
    ])
  })

  test('8-bit limitations', () => {
    // More than 256 to reveal any 8-bit limitations.
    const n = 300
    const lineList: string[] = []
    const charList: string[] = []
    for (let i = 1; i < n + 1; i++) {
      lineList[i - 1] = `${i}\n`
      charList[i - 1] = String.fromCharCode(i)
    }
    expect(lineList.length).toBe(n)

    const lines = lineList.join('')
    const chars = charList.join('')
    expect(chars.length).toBe(n)

    lineList.unshift('')
    const diffs: Diff[] = [[DIFF_DELETE, chars]]
    charsToLines(diffs, lineList)
    expect(diffs).toEqual([[DIFF_DELETE, lines]])
  })

  test('16-bit limitations', () => {
    // More than 65536 to verify any 16-bit limitation.
    const lineList: string[] = []
    for (let i = 0; i < 66000; i++) {
      lineList[i] = `${i}\n`
    }
    const chars = lineList.join('')
    const results = linesToChars(chars, '')
    const diffs: Diff[] = [[DIFF_INSERT, results.chars1]]
    charsToLines(diffs, results.lineArray)
    expect(diffs[0][1]).toEqual(chars)
  })
})
