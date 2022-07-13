import { linesToChars_ } from '../linesToChars'

interface TestExpectation {
  chars1: string
  chars2: string
  lineArray: string[]
}

test('linesToChars', () => {
  function assertLinesToCharsResultEquals(a: TestExpectation, b: TestExpectation) {
    expect(a.chars1).toBe(b.chars1)
    expect(a.chars2).toBe(b.chars2)
    expect(a.lineArray).toEqual(b.lineArray)
  }

  // Convert lines down to characters.
  assertLinesToCharsResultEquals(
    {
      chars1: '\x01\x02\x01',
      chars2: '\x02\x01\x02',
      lineArray: ['', 'alpha\n', 'beta\n'],
    },
    linesToChars_('alpha\nbeta\nalpha\n', 'beta\nalpha\nbeta\n'),
  )

  assertLinesToCharsResultEquals(
    {
      chars1: '',
      chars2: '\x01\x02\x03\x03',
      lineArray: ['', 'alpha\r\n', 'beta\r\n', '\r\n'],
    },
    linesToChars_('', 'alpha\r\nbeta\r\n\r\n\r\n'),
  )

  assertLinesToCharsResultEquals(
    { chars1: '\x01', chars2: '\x02', lineArray: ['', 'a', 'b'] },
    linesToChars_('a', 'b'),
  )

  // More than 256 to reveal any 8-bit limitations.
  const n = 300
  const lineList = []
  const charList = []
  for (let i = 1; i < n + 1; i++) {
    lineList[i - 1] = i + '\n'
    charList[i - 1] = String.fromCharCode(i)
  }
  expect(n).toBe(lineList.length)
  const lines = lineList.join('')
  const chars = charList.join('')
  expect(n).toBe(chars.length)
  lineList.unshift('')
  assertLinesToCharsResultEquals(
    { chars1: chars, chars2: '', lineArray: lineList },
    linesToChars_(lines, ''),
  )
})
