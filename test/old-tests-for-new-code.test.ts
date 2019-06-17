import { bisect_ } from '../src/diff/bisect'
import {
  _cleanupSemantic,
  cleanupMerge,
  cleanupSemanticLossless,
} from '../src/diff/cleanup'
import { cleanupEfficiency } from '../src/diff/cleanupEfficiency'
import { commonOverlap_ } from '../src/diff/commonOverlap'
import { commonPrefix } from '../src/diff/commonPrefix'
import { commonSuffix } from '../src/diff/commonSuffix'
import { Diff, diff, DiffType } from '../src/diff/diff'
import { diffText1, diffText2 } from '../src/diff/diffText'
import { fromDelta } from '../src/diff/fromDelta'
import { halfMatch_ } from '../src/diff/halfMatch'
import { levenshtein } from '../src/diff/levenshtein'
import { charsToLines_ } from '../src/diff/lineMode'
import { linesToChars_ } from '../src/diff/linesToChars'
import { toDelta } from '../src/diff/toDelta'
import { xIndex } from '../src/diff/xIndex'
import { alphabet_, bitap_ } from '../src/match/bitap'
import { match } from '../src/match/match'
import { addPadding, apply, splitMax } from '../src/patch/apply'
import { createPatchObject } from '../src/patch/createPatchObject'
import { addContext_, make } from '../src/patch/make'
import { parse } from '../src/patch/parse'
import { stringify, stringifyPatch } from '../src/patch/stringify'

/**
 * Test Harness for Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If expected and actual are the equivalent, pass the test.
function assertEquivalent(expected: any, actual: any) {
  expect(expected).toEqual(actual)
}

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

// DIFF TEST FUNCTIONS

test('DiffCommonPrefix', () => {
  // Detect any common prefix.
  // Null case.
  assertEquals(0, commonPrefix('abc', 'xyz'))

  // Non-null case.
  assertEquals(4, commonPrefix('1234abcdef', '1234xyz'))

  // Whole case.
  assertEquals(4, commonPrefix('1234', '1234xyz'))
})

test('DiffCommonSuffix', () => {
  // Detect any common suffix.
  // Null case.
  assertEquals(0, commonSuffix('abc', 'xyz'))

  // Non-null case.
  assertEquals(4, commonSuffix('abcdef1234', 'xyz1234'))

  // Whole case.
  assertEquals(4, commonSuffix('1234', 'xyz1234'))
})

test('DiffCommonOverlap', () => {
  // Detect any suffix/prefix overlap.
  // Null case.
  assertEquals(0, commonOverlap_('', 'abcd'))

  // Whole case.
  assertEquals(3, commonOverlap_('abc', 'abcd'))

  // No overlap.
  assertEquals(0, commonOverlap_('123456', 'abcd'))

  // Overlap.
  assertEquals(3, commonOverlap_('123456xxx', 'xxxabcd'))

  // Unicode.
  // Some overly clever languages (C#) may treat ligatures as equal to their
  // component letters.  E.g. U+FB01 === 'fi'
  assertEquals(0, commonOverlap_('fi', '\ufb01i'))
})

test('DiffHalfMatch', () => {
  // Detect a halfmatch.
  // No match.
  assertEquals(null, halfMatch_('1234567890', 'abcdef'))

  assertEquals(null, halfMatch_('12345', '23'))

  // Single Match.
  assertEquivalent(
    ['12', '90', 'a', 'z', '345678'],
    halfMatch_('1234567890', 'a345678z'),
  )

  assertEquivalent(
    ['a', 'z', '12', '90', '345678'],
    halfMatch_('a345678z', '1234567890'),
  )

  assertEquivalent(
    ['abc', 'z', '1234', '0', '56789'],
    halfMatch_('abc56789z', '1234567890'),
  )

  assertEquivalent(
    ['a', 'xyz', '1', '7890', '23456'],
    halfMatch_('a23456xyz', '1234567890'),
  )

  // Multiple Matches.
  assertEquivalent(
    ['12123', '123121', 'a', 'z', '1234123451234'],
    halfMatch_('121231234123451234123121', 'a1234123451234z'),
  )

  assertEquivalent(
    ['', '-=-=-=-=-=', 'x', '', 'x-=-=-=-=-=-=-='],
    halfMatch_('x-=-=-=-=-=-=-=-=-=-=-=-=', 'xx-=-=-=-=-=-=-='),
  )

  assertEquivalent(
    ['-=-=-=-=-=', '', '', 'y', '-=-=-=-=-=-=-=y'],
    halfMatch_('-=-=-=-=-=-=-=-=-=-=-=-=y', '-=-=-=-=-=-=-=yy'),
  )

  // Non-optimal halfmatch.
  // Optimal diff would be -q+x=H-i+e=lloHe+Hu=llo-Hew+y not -qHillo+x=HelloHe-w+Hulloy
  assertEquivalent(
    ['qHillo', 'w', 'x', 'Hulloy', 'HelloHe'],
    halfMatch_('qHilloHelloHew', 'xHelloHeHulloy'),
  )

  assertEquals(null, halfMatch_('qHilloHelloHew', 'xHelloHeHulloy', 0))
})

test('DiffLinesToChars', () => {
  function assertLinesToCharsResultEquals(a, b) {
    assertEquals(a.chars1, b.chars1)
    assertEquals(a.chars2, b.chars2)
    assertEquivalent(a.lineArray, b.lineArray)
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
  for (let x = 1; x < n + 1; x++) {
    lineList[x - 1] = x + '\n'
    charList[x - 1] = String.fromCharCode(x)
  }
  assertEquals(n, lineList.length)
  const lines = lineList.join('')
  const chars = charList.join('')
  assertEquals(n, chars.length)
  lineList.unshift('')
  assertLinesToCharsResultEquals(
    { chars1: chars, chars2: '', lineArray: lineList },
    linesToChars_(lines, ''),
  )
})

test('DiffCharsToLines', () => {
  // Convert chars up to lines.
  const diffs: Diff[] = [
    [DiffType.EQUAL, '\x01\x02\x01'],
    [DiffType.INSERT, '\x02\x01\x02'],
  ]
  charsToLines_(diffs, ['', 'alpha\n', 'beta\n'])
  assertEquivalent(
    [
      [DiffType.EQUAL, 'alpha\nbeta\nalpha\n'],
      [DiffType.INSERT, 'beta\nalpha\nbeta\n'],
    ],
    diffs,
  )

  // More than 256 to reveal any 8-bit limitations.
  const n = 300
  const lineList = []
  const charList = []
  for (let x = 1; x < n + 1; x++) {
    lineList[x - 1] = x + '\n'
    charList[x - 1] = String.fromCharCode(x)
  }
  assertEquals(n, lineList.length)
  const lines = lineList.join('')
  const chars = charList.join('')
  assertEquals(n, chars.length)
  lineList.unshift('')
  const diffs2: Diff[] = [[DiffType.DELETE, chars]]
  charsToLines_(diffs2, lineList)
  assertEquivalent([[DiffType.DELETE, lines]], diffs2)
})

test('DiffCleanupMerge', () => {
  // Cleanup a messy diff.
  // Null case.
  let diffs = []
  cleanupMerge(diffs)
  assertEquivalent([], diffs)

  // No change case.
  diffs = [
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 'b'],
    [DiffType.INSERT, 'c'],
  ]
  cleanupMerge(diffs)
  assertEquivalent(
    [[DiffType.EQUAL, 'a'], [DiffType.DELETE, 'b'], [DiffType.INSERT, 'c']],
    diffs,
  )

  // Merge equalities.
  diffs = [[DiffType.EQUAL, 'a'], [DiffType.EQUAL, 'b'], [DiffType.EQUAL, 'c']]
  cleanupMerge(diffs)
  assertEquivalent([[DiffType.EQUAL, 'abc']], diffs)

  // Merge deletions.
  diffs = [
    [DiffType.DELETE, 'a'],
    [DiffType.DELETE, 'b'],
    [DiffType.DELETE, 'c'],
  ]
  cleanupMerge(diffs)
  assertEquivalent([[DiffType.DELETE, 'abc']], diffs)

  // Merge insertions.
  diffs = [
    [DiffType.INSERT, 'a'],
    [DiffType.INSERT, 'b'],
    [DiffType.INSERT, 'c'],
  ]
  cleanupMerge(diffs)
  assertEquivalent([[DiffType.INSERT, 'abc']], diffs)

  // Merge interweave.
  diffs = [
    [DiffType.DELETE, 'a'],
    [DiffType.INSERT, 'b'],
    [DiffType.DELETE, 'c'],
    [DiffType.INSERT, 'd'],
    [DiffType.EQUAL, 'e'],
    [DiffType.EQUAL, 'f'],
  ]
  cleanupMerge(diffs)
  assertEquivalent(
    [[DiffType.DELETE, 'ac'], [DiffType.INSERT, 'bd'], [DiffType.EQUAL, 'ef']],
    diffs,
  )

  // Prefix and suffix detection.
  diffs = [
    [DiffType.DELETE, 'a'],
    [DiffType.INSERT, 'abc'],
    [DiffType.DELETE, 'dc'],
  ]
  cleanupMerge(diffs)
  assertEquivalent(
    [
      [DiffType.EQUAL, 'a'],
      [DiffType.DELETE, 'd'],
      [DiffType.INSERT, 'b'],
      [DiffType.EQUAL, 'c'],
    ],
    diffs,
  )

  // Prefix and suffix detection with equalities.
  diffs = [
    [DiffType.EQUAL, 'x'],
    [DiffType.DELETE, 'a'],
    [DiffType.INSERT, 'abc'],
    [DiffType.DELETE, 'dc'],
    [DiffType.EQUAL, 'y'],
  ]
  cleanupMerge(diffs)
  assertEquivalent(
    [
      [DiffType.EQUAL, 'xa'],
      [DiffType.DELETE, 'd'],
      [DiffType.INSERT, 'b'],
      [DiffType.EQUAL, 'cy'],
    ],
    diffs,
  )

  // Slide edit left.
  diffs = [
    [DiffType.EQUAL, 'a'],
    [DiffType.INSERT, 'ba'],
    [DiffType.EQUAL, 'c'],
  ]
  cleanupMerge(diffs)
  assertEquivalent([[DiffType.INSERT, 'ab'], [DiffType.EQUAL, 'ac']], diffs)

  // Slide edit right.
  diffs = [
    [DiffType.EQUAL, 'c'],
    [DiffType.INSERT, 'ab'],
    [DiffType.EQUAL, 'a'],
  ]
  cleanupMerge(diffs)
  assertEquivalent([[DiffType.EQUAL, 'ca'], [DiffType.INSERT, 'ba']], diffs)

  // Slide edit left recursive.
  diffs = [
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 'b'],
    [DiffType.EQUAL, 'c'],
    [DiffType.DELETE, 'ac'],
    [DiffType.EQUAL, 'x'],
  ]
  cleanupMerge(diffs)
  assertEquivalent([[DiffType.DELETE, 'abc'], [DiffType.EQUAL, 'acx']], diffs)

  // Slide edit right recursive.
  diffs = [
    [DiffType.EQUAL, 'x'],
    [DiffType.DELETE, 'ca'],
    [DiffType.EQUAL, 'c'],
    [DiffType.DELETE, 'b'],
    [DiffType.EQUAL, 'a'],
  ]
  cleanupMerge(diffs)
  assertEquivalent([[DiffType.EQUAL, 'xca'], [DiffType.DELETE, 'cba']], diffs)
})

test('DiffCleanupSemanticLossless', () => {
  // Slide diffs to match logical boundaries.
  // Null case.
  let diffs = []
  cleanupSemanticLossless(diffs)
  assertEquivalent([], diffs)

  // Blank lines.
  diffs = [
    [DiffType.EQUAL, 'AAA\r\n\r\nBBB'],
    [DiffType.INSERT, '\r\nDDD\r\n\r\nBBB'],
    [DiffType.EQUAL, '\r\nEEE'],
  ]
  cleanupSemanticLossless(diffs)
  assertEquivalent(
    [
      [DiffType.EQUAL, 'AAA\r\n\r\n'],
      [DiffType.INSERT, 'BBB\r\nDDD\r\n\r\n'],
      [DiffType.EQUAL, 'BBB\r\nEEE'],
    ],
    diffs,
  )

  // Line boundaries.
  diffs = [
    [DiffType.EQUAL, 'AAA\r\nBBB'],
    [DiffType.INSERT, ' DDD\r\nBBB'],
    [DiffType.EQUAL, ' EEE'],
  ]
  cleanupSemanticLossless(diffs)
  assertEquivalent(
    [
      [DiffType.EQUAL, 'AAA\r\n'],
      [DiffType.INSERT, 'BBB DDD\r\n'],
      [DiffType.EQUAL, 'BBB EEE'],
    ],
    diffs,
  )

  // Word boundaries.
  diffs = [
    [DiffType.EQUAL, 'The c'],
    [DiffType.INSERT, 'ow and the c'],
    [DiffType.EQUAL, 'at.'],
  ]
  cleanupSemanticLossless(diffs)
  assertEquivalent(
    [
      [DiffType.EQUAL, 'The '],
      [DiffType.INSERT, 'cow and the '],
      [DiffType.EQUAL, 'cat.'],
    ],
    diffs,
  )

  // Alphanumeric boundaries.
  diffs = [
    [DiffType.EQUAL, 'The-c'],
    [DiffType.INSERT, 'ow-and-the-c'],
    [DiffType.EQUAL, 'at.'],
  ]
  cleanupSemanticLossless(diffs)
  assertEquivalent(
    [
      [DiffType.EQUAL, 'The-'],
      [DiffType.INSERT, 'cow-and-the-'],
      [DiffType.EQUAL, 'cat.'],
    ],
    diffs,
  )

  // Hitting the start.
  diffs = [
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 'a'],
    [DiffType.EQUAL, 'ax'],
  ]
  cleanupSemanticLossless(diffs)
  assertEquivalent([[DiffType.DELETE, 'a'], [DiffType.EQUAL, 'aax']], diffs)

  // Hitting the end.
  diffs = [
    [DiffType.EQUAL, 'xa'],
    [DiffType.DELETE, 'a'],
    [DiffType.EQUAL, 'a'],
  ]
  cleanupSemanticLossless(diffs)
  assertEquivalent([[DiffType.EQUAL, 'xaa'], [DiffType.DELETE, 'a']], diffs)

  // Sentence boundaries.
  diffs = [
    [DiffType.EQUAL, 'The xxx. The '],
    [DiffType.INSERT, 'zzz. The '],
    [DiffType.EQUAL, 'yyy.'],
  ]
  cleanupSemanticLossless(diffs)
  assertEquivalent(
    [
      [DiffType.EQUAL, 'The xxx.'],
      [DiffType.INSERT, ' The zzz.'],
      [DiffType.EQUAL, ' The yyy.'],
    ],
    diffs,
  )
})

test('DiffCleanupSemantic', () => {
  // Cleanup semantically trivial equalities.
  // Null case.
  let diffs = []
  _cleanupSemantic(diffs)
  assertEquivalent([], diffs)

  // No elimination #1.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, 'cd'],
    [DiffType.EQUAL, '12'],
    [DiffType.DELETE, 'e'],
  ]
  _cleanupSemantic(diffs)
  assertEquivalent(
    [
      [DiffType.DELETE, 'ab'],
      [DiffType.INSERT, 'cd'],
      [DiffType.EQUAL, '12'],
      [DiffType.DELETE, 'e'],
    ],
    diffs,
  )

  // No elimination #2.
  diffs = [
    [DiffType.DELETE, 'abc'],
    [DiffType.INSERT, 'ABC'],
    [DiffType.EQUAL, '1234'],
    [DiffType.DELETE, 'wxyz'],
  ]
  _cleanupSemantic(diffs)
  assertEquivalent(
    [
      [DiffType.DELETE, 'abc'],
      [DiffType.INSERT, 'ABC'],
      [DiffType.EQUAL, '1234'],
      [DiffType.DELETE, 'wxyz'],
    ],
    diffs,
  )

  // Simple elimination.
  diffs = [
    [DiffType.DELETE, 'a'],
    [DiffType.EQUAL, 'b'],
    [DiffType.DELETE, 'c'],
  ]
  _cleanupSemantic(diffs)
  assertEquivalent([[DiffType.DELETE, 'abc'], [DiffType.INSERT, 'b']], diffs)

  // Backpass elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.EQUAL, 'cd'],
    [DiffType.DELETE, 'e'],
    [DiffType.EQUAL, 'f'],
    [DiffType.INSERT, 'g'],
  ]
  _cleanupSemantic(diffs)
  assertEquivalent(
    [[DiffType.DELETE, 'abcdef'], [DiffType.INSERT, 'cdfg']],
    diffs,
  )

  // Multiple eliminations.
  diffs = [
    [DiffType.INSERT, '1'],
    [DiffType.EQUAL, 'A'],
    [DiffType.DELETE, 'B'],
    [DiffType.INSERT, '2'],
    [DiffType.EQUAL, '_'],
    [DiffType.INSERT, '1'],
    [DiffType.EQUAL, 'A'],
    [DiffType.DELETE, 'B'],
    [DiffType.INSERT, '2'],
  ]
  _cleanupSemantic(diffs)
  assertEquivalent(
    [[DiffType.DELETE, 'AB_AB'], [DiffType.INSERT, '1A2_1A2']],
    diffs,
  )

  // Word boundaries.
  diffs = [
    [DiffType.EQUAL, 'The c'],
    [DiffType.DELETE, 'ow and the c'],
    [DiffType.EQUAL, 'at.'],
  ]
  _cleanupSemantic(diffs)
  assertEquivalent(
    [
      [DiffType.EQUAL, 'The '],
      [DiffType.DELETE, 'cow and the '],
      [DiffType.EQUAL, 'cat.'],
    ],
    diffs,
  )

  // No overlap elimination.
  diffs = [[DiffType.DELETE, 'abcxx'], [DiffType.INSERT, 'xxdef']]
  _cleanupSemantic(diffs)
  assertEquivalent(
    [[DiffType.DELETE, 'abcxx'], [DiffType.INSERT, 'xxdef']],
    diffs,
  )

  // Overlap elimination.
  diffs = [[DiffType.DELETE, 'abcxxx'], [DiffType.INSERT, 'xxxdef']]
  _cleanupSemantic(diffs)
  assertEquivalent(
    [
      [DiffType.DELETE, 'abc'],
      [DiffType.EQUAL, 'xxx'],
      [DiffType.INSERT, 'def'],
    ],
    diffs,
  )

  // Reverse overlap elimination.
  diffs = [[DiffType.DELETE, 'xxxabc'], [DiffType.INSERT, 'defxxx']]
  _cleanupSemantic(diffs)
  assertEquivalent(
    [
      [DiffType.INSERT, 'def'],
      [DiffType.EQUAL, 'xxx'],
      [DiffType.DELETE, 'abc'],
    ],
    diffs,
  )

  // Two overlap eliminations.
  diffs = [
    [DiffType.DELETE, 'abcd1212'],
    [DiffType.INSERT, '1212efghi'],
    [DiffType.EQUAL, '----'],
    [DiffType.DELETE, 'A3'],
    [DiffType.INSERT, '3BC'],
  ]
  _cleanupSemantic(diffs)
  assertEquivalent(
    [
      [DiffType.DELETE, 'abcd'],
      [DiffType.EQUAL, '1212'],
      [DiffType.INSERT, 'efghi'],
      [DiffType.EQUAL, '----'],
      [DiffType.DELETE, 'A'],
      [DiffType.EQUAL, '3'],
      [DiffType.INSERT, 'BC'],
    ],
    diffs,
  )
})

test('DiffCleanupEfficiency', () => {
  // Cleanup operationally trivial equalities.
  // Null case.
  let diffs = []
  cleanupEfficiency(diffs)
  assertEquivalent([], diffs)

  // No elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'wxyz'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '34'],
  ]
  cleanupEfficiency(diffs)
  assertEquivalent(
    [
      [DiffType.DELETE, 'ab'],
      [DiffType.INSERT, '12'],
      [DiffType.EQUAL, 'wxyz'],
      [DiffType.DELETE, 'cd'],
      [DiffType.INSERT, '34'],
    ],
    diffs,
  )

  // Four-edit elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'xyz'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '34'],
  ]
  cleanupEfficiency(diffs)
  assertEquivalent(
    [[DiffType.DELETE, 'abxyzcd'], [DiffType.INSERT, '12xyz34']],
    diffs,
  )

  // Three-edit elimination.
  diffs = [
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'x'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '34'],
  ]
  cleanupEfficiency(diffs)
  assertEquivalent(
    [[DiffType.DELETE, 'xcd'], [DiffType.INSERT, '12x34']],
    diffs,
  )

  // Backpass elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'xy'],
    [DiffType.INSERT, '34'],
    [DiffType.EQUAL, 'z'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '56'],
  ]
  cleanupEfficiency(diffs)
  assertEquivalent(
    [[DiffType.DELETE, 'abxyzcd'], [DiffType.INSERT, '12xy34z56']],
    diffs,
  )

  // High cost elimination.
  diffs = [
    [DiffType.DELETE, 'ab'],
    [DiffType.INSERT, '12'],
    [DiffType.EQUAL, 'wxyz'],
    [DiffType.DELETE, 'cd'],
    [DiffType.INSERT, '34'],
  ]
  cleanupEfficiency(diffs, 5)
  assertEquivalent(
    [[DiffType.DELETE, 'abwxyzcd'], [DiffType.INSERT, '12wxyz34']],
    diffs,
  )
})

test('DiffText', () => {
  // Compute the source and destination texts.
  const diffs: Diff[] = [
    [DiffType.EQUAL, 'jump'],
    [DiffType.DELETE, 's'],
    [DiffType.INSERT, 'ed'],
    [DiffType.EQUAL, ' over '],
    [DiffType.DELETE, 'the'],
    [DiffType.INSERT, 'a'],
    [DiffType.EQUAL, ' lazy'],
  ]
  assertEquals('jumps over the lazy', diffText1(diffs))

  assertEquals('jumped over a lazy', diffText2(diffs))
})

test('DiffDelta', () => {
  // Convert a diff into delta string.
  let diffs: Diff[] = [
    [DiffType.EQUAL, 'jump'],
    [DiffType.DELETE, 's'],
    [DiffType.INSERT, 'ed'],
    [DiffType.EQUAL, ' over '],
    [DiffType.DELETE, 'the'],
    [DiffType.INSERT, 'a'],
    [DiffType.EQUAL, ' lazy'],
    [DiffType.INSERT, 'old dog'],
  ]
  let text1 = diffText1(diffs)
  assertEquals('jumps over the lazy', text1)

  let delta = toDelta(diffs)
  assertEquals('=4\t-1\t+ed\t=6\t-3\t+a\t=5\t+old dog', delta)

  // Convert delta string into a diff.
  assertEquivalent(diffs, fromDelta(text1, delta))

  // Generates error (19 !==  20).
  try {
    fromDelta(text1 + 'x', delta)
    assertEquals(Error, null)
  } catch (e) {
    // Exception expected.
  }

  // Generates error (19 !==  18).
  try {
    fromDelta(text1.substring(1), delta)
    assertEquals(Error, null)
  } catch (e) {
    // Exception expected.
  }

  // Generates error (%c3%xy invalid Unicode).
  try {
    fromDelta('', '+%c3%xy')
    assertEquals(Error, null)
  } catch (e) {
    // Exception expected.
  }

  // Test deltas with special characters.
  diffs = [
    [DiffType.EQUAL, '\u0680 \x00 \t %'],
    [DiffType.DELETE, '\u0681 \x01 \n ^'],
    [DiffType.INSERT, '\u0682 \x02 \\ |'],
  ]
  text1 = diffText1(diffs)
  assertEquals('\u0680 \x00 \t %\u0681 \x01 \n ^', text1)

  delta = toDelta(diffs)
  assertEquals('=7\t-7\t+%DA%82 %02 %5C %7C', delta)

  // Convert delta string into a diff.
  assertEquivalent(diffs, fromDelta(text1, delta))

  // Verify pool of unchanged characters.
  diffs = [
    [DiffType.INSERT, "A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , # "],
  ]
  const text2 = diffText2(diffs)
  assertEquals("A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , # ", text2)

  delta = toDelta(diffs)
  assertEquals("+A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , # ", delta)

  // Convert delta string into a diff.
  assertEquivalent(diffs, fromDelta('', delta))
})

test('DiffXIndex', () => {
  // Translate a location in text1 to text2.
  // Translation on equality.
  assertEquals(
    5,
    xIndex(
      [
        [DiffType.DELETE, 'a'],
        [DiffType.INSERT, '1234'],
        [DiffType.EQUAL, 'xyz'],
      ],
      2,
    ),
  )

  // Translation on deletion.
  assertEquals(
    1,
    xIndex(
      [
        [DiffType.EQUAL, 'a'],
        [DiffType.DELETE, '1234'],
        [DiffType.EQUAL, 'xyz'],
      ],
      3,
    ),
  )
})

test('DiffLevenshtein', () => {
  // Levenshtein with trailing equality.
  assertEquals(
    4,
    levenshtein([
      [DiffType.DELETE, 'abc'],
      [DiffType.INSERT, '1234'],
      [DiffType.EQUAL, 'xyz'],
    ]),
  )
  // Levenshtein with leading equality.
  assertEquals(
    4,
    levenshtein([
      [DiffType.EQUAL, 'xyz'],
      [DiffType.DELETE, 'abc'],
      [DiffType.INSERT, '1234'],
    ]),
  )
  // Levenshtein with middle equality.
  assertEquals(
    7,
    levenshtein([
      [DiffType.DELETE, 'abc'],
      [DiffType.EQUAL, 'xyz'],
      [DiffType.INSERT, '1234'],
    ]),
  )
})

test('DiffBisect', () => {
  // Normal.
  const a = 'cat'
  const b = 'map'
  // Since the resulting diff hasn't been normalized, it would be ok if
  // the insertion and deletion pairs are swapped.
  // If the order changes, tweak this test as required.
  assertEquivalent(
    [
      [DiffType.DELETE, 'c'],
      [DiffType.INSERT, 'm'],
      [DiffType.EQUAL, 'a'],
      [DiffType.DELETE, 't'],
      [DiffType.INSERT, 'p'],
    ],
    bisect_(a, b, Number.MAX_VALUE),
  )

  // Timeout.
  assertEquivalent(
    [[DiffType.DELETE, 'cat'], [DiffType.INSERT, 'map']],
    bisect_(a, b, 0),
  )
})

test('DiffMain', () => {
  // Perform a trivial diff.
  // Null case.
  assertEquivalent([], diff('', '', { checkLines: false }))

  // Equality.
  assertEquivalent(
    [[DiffType.EQUAL, 'abc']],
    diff('abc', 'abc', { checkLines: false }),
  )

  // Simple insertion.
  assertEquivalent(
    [[DiffType.EQUAL, 'ab'], [DiffType.INSERT, '123'], [DiffType.EQUAL, 'c']],
    diff('abc', 'ab123c', { checkLines: false }),
  )

  // Simple deletion.
  assertEquivalent(
    [[DiffType.EQUAL, 'a'], [DiffType.DELETE, '123'], [DiffType.EQUAL, 'bc']],
    diff('a123bc', 'abc', { checkLines: false }),
  )

  // Two insertions.
  assertEquivalent(
    [
      [DiffType.EQUAL, 'a'],
      [DiffType.INSERT, '123'],
      [DiffType.EQUAL, 'b'],
      [DiffType.INSERT, '456'],
      [DiffType.EQUAL, 'c'],
    ],
    diff('abc', 'a123b456c', { checkLines: false }),
  )

  // Two deletions.
  assertEquivalent(
    [
      [DiffType.EQUAL, 'a'],
      [DiffType.DELETE, '123'],
      [DiffType.EQUAL, 'b'],
      [DiffType.DELETE, '456'],
      [DiffType.EQUAL, 'c'],
    ],
    diff('a123b456c', 'abc', { checkLines: false }),
  )

  // Perform a real diff.
  // switch off timeut
  // Simple cases.
  assertEquivalent(
    [[DiffType.DELETE, 'a'], [DiffType.INSERT, 'b']],
    diff('a', 'b', { checkLines: false, timeout: 0 }),
  )

  assertEquivalent(
    [
      [DiffType.DELETE, 'Apple'],
      [DiffType.INSERT, 'Banana'],
      [DiffType.EQUAL, 's are a'],
      [DiffType.INSERT, 'lso'],
      [DiffType.EQUAL, ' fruit.'],
    ],
    diff('Apples are a fruit.', 'Bananas are also fruit.', {
      checkLines: false,
    }),
  )

  assertEquivalent(
    [
      [DiffType.DELETE, 'a'],
      [DiffType.INSERT, '\u0680'],
      [DiffType.EQUAL, 'x'],
      [DiffType.DELETE, '\t'],
      [DiffType.INSERT, '\0'],
    ],
    diff('ax\t', '\u0680x\0', { checkLines: false }),
  )

  // Overlaps.
  assertEquivalent(
    [
      [DiffType.DELETE, '1'],
      [DiffType.EQUAL, 'a'],
      [DiffType.DELETE, 'y'],
      [DiffType.EQUAL, 'b'],
      [DiffType.DELETE, '2'],
      [DiffType.INSERT, 'xab'],
    ],
    diff('1ayb2', 'abxab', { checkLines: false }),
  )

  assertEquivalent(
    [
      [DiffType.INSERT, 'xaxcx'],
      [DiffType.EQUAL, 'abc'],
      [DiffType.DELETE, 'y'],
    ],
    diff('abcy', 'xaxcxabc', { checkLines: false }),
  )

  assertEquivalent(
    [
      [DiffType.DELETE, 'ABCD'],
      [DiffType.EQUAL, 'a'],
      [DiffType.DELETE, '='],
      [DiffType.INSERT, '-'],
      [DiffType.EQUAL, 'bcd'],
      [DiffType.DELETE, '='],
      [DiffType.INSERT, '-'],
      [DiffType.EQUAL, 'efghijklmnopqrs'],
      [DiffType.DELETE, 'EFGHIJKLMNOefg'],
    ],
    diff('ABCDa=bcd=efghijklmnopqrsEFGHIJKLMNOefg', 'a-bcd-efghijklmnopqrs', {
      checkLines: false,
    }),
  )

  // Large equality.
  assertEquivalent(
    [
      [DiffType.INSERT, ' '],
      [DiffType.EQUAL, 'a'],
      [DiffType.INSERT, 'nd'],
      [DiffType.EQUAL, ' [[Pennsylvania]]'],
      [DiffType.DELETE, ' and [[New'],
    ],
    diff('a [[Pennsylvania]] and [[New', ' and [[Pennsylvania]]', {
      checkLines: false,
    }),
  )

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
  assertEquivalent(
    diff(a, b, { checkLines: false }),
    diff(a, b, { checkLines: true }),
  )

  // Single line-mode.
  a =
    '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
  b =
    'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij'
  assertEquivalent(
    diff(a, b, { checkLines: false }),
    diff(a, b, { checkLines: true }),
  )

  // Overlap line-mode.
  a =
    '1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n'
  b =
    'abcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n'
  const textsLinemode = diff_rebuildtexts(diff(a, b, { checkLines: true }))
  const textsTextmode = diff_rebuildtexts(diff(a, b, { checkLines: false }))
  assertEquivalent(textsTextmode, textsLinemode)

  // Test null inputs.
  try {
    diff(null, null)
    assertEquals(Error, null)
  } catch (e) {
    // Exception expected.
  }
})

// MATCH TEST FUNCTIONS

test('MatchAlphabet', () => {
  // Initialise the bitmasks for Bitap.
  // Unique.
  assertEquivalent({ a: 4, b: 2, c: 1 }, alphabet_('abc'))

  // Duplicates.
  assertEquivalent({ a: 37, b: 18, c: 8 }, alphabet_('abcaba'))
})

test('MatchBitap', () => {
  // Bitap algorithm.
  const options = { distance: 100, threshold: 0.5 }
  // Exact matches.
  assertEquals(5, bitap_('abcdefghijk', 'fgh', 5, options))

  assertEquals(5, bitap_('abcdefghijk', 'fgh', 0, options))

  // Fuzzy matches.
  assertEquals(4, bitap_('abcdefghijk', 'efxhi', 0, options))

  assertEquals(2, bitap_('abcdefghijk', 'cdefxyhijk', 5, options))

  assertEquals(-1, bitap_('abcdefghijk', 'bxy', 1, options))

  // Overflow.
  assertEquals(2, bitap_('123456789xx0', '3456789x0', 2, options))

  // Threshold test.
  assertEquals(
    4,
    bitap_('abcdefghijk', 'efxyhi', 1, { ...options, threshold: 0.4 }),
  )

  assertEquals(
    -1,
    bitap_('abcdefghijk', 'efxyhi', 1, { ...options, threshold: 0.3 }),
  )

  assertEquals(
    1,
    bitap_('abcdefghijk', 'bcdef', 1, { ...options, threshold: 0 }),
  )

  // Multiple select.
  assertEquals(0, bitap_('abcdexyzabcde', 'abccde', 3, options))

  assertEquals(8, bitap_('abcdexyzabcde', 'abccde', 5, options))

  // Distance test.
  assertEquals(
    -1,
    bitap_('abcdefghijklmnopqrstuvwxyz', 'abcdefg', 24, {
      ...options,
      distance: 10, // Strict location.
    }),
  )

  assertEquals(
    0,
    bitap_('abcdefghijklmnopqrstuvwxyz', 'abcdxxefg', 1, {
      ...options,
      distance: 10, // Strict location.
    }),
  )

  assertEquals(
    0,
    bitap_('abcdefghijklmnopqrstuvwxyz', 'abcdefg', 24, {
      ...options,
      distance: 1000, // Loose location.
    }),
  )
})

test('MatchMain', () => {
  // Full match.
  // Shortcut matches.
  assertEquals(0, match('abcdef', 'abcdef', 1000))

  assertEquals(-1, match('', 'abcdef', 1))

  assertEquals(3, match('abcdef', '', 3))

  assertEquals(3, match('abcdef', 'de', 3))

  // Beyond end match.
  assertEquals(3, match('abcdef', 'defy', 4))

  // Oversized pattern.
  assertEquals(0, match('abcdef', 'abcdefy', 0))

  // Complex match.
  assertEquals(
    4,
    match('I am the very model of a modern major general.', ' that berry ', 5),
  )

  // Test null inputs.
  try {
    match(null, null, 0)
    assertEquals(Error, null)
  } catch (e) {
    // Exception expected.
  }
})

//
// // PATCH TEST FUNCTIONS
//
test('PatchObj', () => {
  // Patch Object.
  const p = createPatchObject(20, 21)
  p.length1 = 18
  p.length2 = 17
  p.diffs = [
    [DiffType.EQUAL, 'jump'],
    [DiffType.DELETE, 's'],
    [DiffType.INSERT, 'ed'],
    [DiffType.EQUAL, ' over '],
    [DiffType.DELETE, 'the'],
    [DiffType.INSERT, 'a'],
    [DiffType.EQUAL, '\nlaz'],
  ]
  const strp = stringifyPatch(p)
  assertEquals(
    '@@ -21,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n %0Alaz\n',
    strp,
  )
})

test('PatchFromText', () => {
  assertEquivalent([], parse(''))

  const strp =
    '@@ -21,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n %0Alaz\n'
  assertEquals(strp, stringifyPatch(parse(strp)[0]))

  assertEquals(
    '@@ -1 +1 @@\n-a\n+b\n',
    stringifyPatch(parse('@@ -1 +1 @@\n-a\n+b\n')[0]),
  )

  assertEquals(
    '@@ -1,3 +0,0 @@\n-abc\n',
    stringifyPatch(parse('@@ -1,3 +0,0 @@\n-abc\n')[0]),
  )

  assertEquals(
    '@@ -0,0 +1,3 @@\n+abc\n',
    stringifyPatch(parse('@@ -0,0 +1,3 @@\n+abc\n')[0]),
  )

  // Generates error.
  try {
    parse('Bad\nPatch\n')
    assertEquals(Error, null)
  } catch (e) {
    // Exception expected.
  }
})

test('PatchToText', () => {
  let strp = '@@ -21,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n  laz\n'
  let p = parse(strp)
  assertEquals(strp, stringify(p))

  strp =
    '@@ -1,9 +1,9 @@\n-f\n+F\n oo+fooba\n@@ -7,9 +7,9 @@\n obar\n-,\n+.\n  tes\n'
  p = parse(strp)
  assertEquals(strp, stringify(p))
})

test('PatchAddContext', () => {
  let p = parse('@@ -21,4 +21,10 @@\n-jump\n+somersault\n')[0]
  addContext_(p, 'The quick brown fox jumps over the lazy dog.', { margin: 4 })
  assertEquals(
    '@@ -17,12 +17,18 @@\n fox \n-jump\n+somersault\n s ov\n',
    stringifyPatch(p),
  )

  // Same, but not enough trailing context.
  p = parse('@@ -21,4 +21,10 @@\n-jump\n+somersault\n')[0]
  addContext_(p, 'The quick brown fox jumps.', { margin: 4 })
  assertEquals(
    '@@ -17,10 +17,16 @@\n fox \n-jump\n+somersault\n s.\n',
    stringifyPatch(p),
  )

  // Same, but not enough leading context.
  p = parse('@@ -3 +3,2 @@\n-e\n+at\n')[0]
  addContext_(p, 'The quick brown fox jumps.', { margin: 4 })
  assertEquals('@@ -1,7 +1,8 @@\n Th\n-e\n+at\n  qui\n', stringifyPatch(p))

  // Same, but with ambiguity.
  p = parse('@@ -3 +3,2 @@\n-e\n+at\n')[0]
  addContext_(p, 'The quick brown fox jumps.  The quick brown fox crashes.', {
    margin: 4,
  })
  assertEquals(
    '@@ -1,27 +1,28 @@\n Th\n-e\n+at\n  quick brown fox jumps. \n',
    stringifyPatch(p),
  )
})

test('PatchMake', () => {
  // Null case.
  let patches = make('', '')
  assertEquals('', stringify(patches))

  let text1 = 'The quick brown fox jumps over the lazy dog.'
  let text2 = 'That quick brown fox jumped over a lazy dog.'
  // Text2+Text1 inputs.
  let expectedPatch =
    '@@ -1,8 +1,7 @@\n Th\n-at\n+e\n  qui\n@@ -21,17 +21,18 @@\n jump\n-ed\n+s\n  over \n-a\n+the\n  laz\n'
  // The second patch must be "-21,17 +21,18", not "-22,17 +21,18" due to rolling context.
  patches = make(text2, text1)
  assertEquals(expectedPatch, stringify(patches))

  // Text1+Text2 inputs.
  expectedPatch =
    '@@ -1,11 +1,12 @@\n Th\n-e\n+at\n  quick b\n@@ -22,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n  laz\n'
  patches = make(text1, text2)
  assertEquals(expectedPatch, stringify(patches))

  // Diff input.
  let diffs = diff(text1, text2, { checkLines: false })
  patches = make(diffs)
  assertEquals(expectedPatch, stringify(patches))

  // Text1+Diff inputs.
  patches = make(text1, diffs)
  assertEquals(expectedPatch, stringify(patches))

  // Character encoding.
  patches = make("`1234567890-=[]\\;',./", '~!@#$%^&*()_+{}|:"<>?')
  assertEquals(
    "@@ -1,21 +1,21 @@\n-%601234567890-=%5B%5D%5C;',./\n+~!@#$%25%5E&*()_+%7B%7D%7C:%22%3C%3E?\n",
    stringify(patches),
  )

  // Character decoding.
  diffs = [
    [DiffType.DELETE, "`1234567890-=[]\\;',./"],
    [DiffType.INSERT, '~!@#$%^&*()_+{}|:"<>?'],
  ]
  assertEquivalent(
    diffs,
    parse(
      "@@ -1,21 +1,21 @@\n-%601234567890-=%5B%5D%5C;',./\n+~!@#$%25%5E&*()_+%7B%7D%7C:%22%3C%3E?\n",
    )[0].diffs,
  )

  // Long string with repeats.
  text1 = ''
  for (let x = 0; x < 100; x++) {
    text1 += 'abcdef'
  }
  text2 = text1 + '123'
  expectedPatch = '@@ -573,28 +573,31 @@\n cdefabcdefabcdefabcdefabcdef\n+123\n'
  patches = make(text1, text2)
  assertEquals(expectedPatch, stringify(patches))

  // Test null inputs.
  try {
    make(null)
    assertEquals(Error, null)
  } catch (e) {
    // Exception expected.
  }
})

test('PatchSplitMax', () => {
  // Assumes that dmp.Match_MaxBits is 32.
  let patches = make(
    'abcdefghijklmnopqrstuvwxyz01234567890',
    'XabXcdXefXghXijXklXmnXopXqrXstXuvXwxXyzX01X23X45X67X89X0',
  )
  splitMax(patches)
  assertEquals(
    '@@ -1,32 +1,46 @@\n+X\n ab\n+X\n cd\n+X\n ef\n+X\n gh\n+X\n ij\n+X\n kl\n+X\n mn\n+X\n op\n+X\n qr\n+X\n st\n+X\n uv\n+X\n wx\n+X\n yz\n+X\n 012345\n@@ -25,13 +39,18 @@\n zX01\n+X\n 23\n+X\n 45\n+X\n 67\n+X\n 89\n+X\n 0\n',
    stringify(patches),
  )

  patches = make(
    'abcdef1234567890123456789012345678901234567890123456789012345678901234567890uvwxyz',
    'abcdefuvwxyz',
  )
  const oldToText = stringify(patches)
  splitMax(patches)
  assertEquals(oldToText, stringify(patches))

  patches = make(
    '1234567890123456789012345678901234567890123456789012345678901234567890',
    'abc',
  )
  splitMax(patches)
  assertEquals(
    '@@ -1,32 +1,4 @@\n-1234567890123456789012345678\n 9012\n@@ -29,32 +1,4 @@\n-9012345678901234567890123456\n 7890\n@@ -57,14 +1,3 @@\n-78901234567890\n+abc\n',
    stringify(patches),
  )

  patches = make(
    'abcdefghij , h : 0 , t : 1 abcdefghij , h : 0 , t : 1 abcdefghij , h : 0 , t : 1',
    'abcdefghij , h : 1 , t : 1 abcdefghij , h : 1 , t : 1 abcdefghij , h : 0 , t : 1',
  )
  splitMax(patches)
  assertEquals(
    '@@ -2,32 +2,32 @@\n bcdefghij , h : \n-0\n+1\n  , t : 1 abcdef\n@@ -29,32 +29,32 @@\n bcdefghij , h : \n-0\n+1\n  , t : 1 abcdef\n',
    stringify(patches),
  )
})

test('PatchAddPadding', () => {
  // Both edges full.
  let patches = make('', 'test')
  assertEquals('@@ -0,0 +1,4 @@\n+test\n', stringify(patches))
  addPadding(patches)
  assertEquals(
    '@@ -1,8 +1,12 @@\n %01%02%03%04\n+test\n %01%02%03%04\n',
    stringify(patches),
  )

  // Both edges partial.
  patches = make('XY', 'XtestY')
  assertEquals('@@ -1,2 +1,6 @@\n X\n+test\n Y\n', stringify(patches))
  addPadding(patches)
  assertEquals(
    '@@ -2,8 +2,12 @@\n %02%03%04X\n+test\n Y%01%02%03\n',
    stringify(patches),
  )

  // Both edges none.
  patches = make('XXXXYYYY', 'XXXXtestYYYY')
  assertEquals('@@ -1,8 +1,12 @@\n XXXX\n+test\n YYYY\n', stringify(patches))
  addPadding(patches)
  assertEquals('@@ -5,8 +5,12 @@\n XXXX\n+test\n YYYY\n', stringify(patches))
})

test('PatchApply', () => {
  // Null case.
  let patches = make('', '')
  let results = apply(patches, 'Hello world.', { deleteThreshold: 0.5 })
  assertEquivalent(['Hello world.', []], results)

  // Exact match.
  patches = make(
    'The quick brown fox jumps over the lazy dog.',
    'That quick brown fox jumped over a lazy dog.',
  )
  results = apply(patches, 'The quick brown fox jumps over the lazy dog.')
  assertEquivalent(
    ['That quick brown fox jumped over a lazy dog.', [true, true]],
    results,
  )

  // Partial match.
  results = apply(patches, 'The quick red rabbit jumps over the tired tiger.')
  assertEquivalent(
    ['That quick red rabbit jumped over a tired tiger.', [true, true]],
    results,
  )

  // Failed match.
  results = apply(patches, 'I am the very model of a modern major general.')
  assertEquivalent(
    ['I am the very model of a modern major general.', [false, false]],
    results,
  )

  // Big delete, small change.
  patches = make(
    'x1234567890123456789012345678901234567890123456789012345678901234567890y',
    'xabcy',
  )
  results = apply(
    patches,
    'x123456789012345678901234567890-----++++++++++-----123456789012345678901234567890y',
  )
  assertEquivalent(['xabcy', [true, true]], results)

  // Big delete, big change 1.
  patches = make(
    'x1234567890123456789012345678901234567890123456789012345678901234567890y',
    'xabcy',
  )
  results = apply(
    patches,
    'x12345678901234567890---------------++++++++++---------------12345678901234567890y',
  )
  assertEquivalent(
    [
      'xabc12345678901234567890---------------++++++++++---------------12345678901234567890y',
      [false, true],
    ],
    results,
  )

  // Big delete, big change 2.
  patches = make(
    'x1234567890123456789012345678901234567890123456789012345678901234567890y',
    'xabcy',
  )
  results = apply(
    patches,
    'x12345678901234567890---------------++++++++++---------------12345678901234567890y',
    { deleteThreshold: 0.6 },
  )
  assertEquivalent(['xabcy', [true, true]], results)

  // Compensate for failed patch.
  patches = make(
    'abcdefghijklmnopqrstuvwxyz--------------------1234567890',
    'abcXXXXXXXXXXdefghijklmnopqrstuvwxyz--------------------1234567YYYYYYYYYY890',
  )
  results = apply(
    patches,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ--------------------1234567890',
    { deleteThreshold: 0.5 },
  )
  assertEquivalent(
    [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ--------------------1234567YYYYYYYYYY890',
      [false, true],
    ],
    results,
  )

  // No side effects.
  patches = make('', 'test')
  let patchstr = stringify(patches)
  apply(patches, '')
  assertEquals(patchstr, stringify(patches))

  // No side effects with major delete.
  patches = make('The quick brown fox jumps over the lazy dog.', 'Woof')
  patchstr = stringify(patches)
  apply(patches, 'The quick brown fox jumps over the lazy dog.')
  assertEquals(patchstr, stringify(patches))

  // Edge exact match.
  patches = make('', 'test')
  results = apply(patches, '')
  assertEquivalent(['test', [true]], results)

  // Near edge exact match.
  patches = make('XY', 'XtestY')
  results = apply(patches, 'XY')
  assertEquivalent(['XtestY', [true]], results)

  // Edge partial match.
  patches = make('y', 'y123')
  results = apply(patches, 'x')
  assertEquivalent(['x123', [true]], results)
})

/**
 * End of test harness, now run tests
 */

// If expected and actual are the identical, print 'Ok', otherwise 'Fail!'
function assertEquals(msg: string, expected: any, actual: any)
function assertEquals(expected: any, actual: any)
function assertEquals(...args) {
  const [msg, expected, actual] =
    args.length === 3 ? args : ['', args[0], args[1]]

  expect(actual).toBe(expected) // msg
}
