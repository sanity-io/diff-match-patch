import {expect, test} from 'vitest'

import {
  // Patch
  applyPatches,
  cleanupEfficiency,
  cleanupSemantic,
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  // Diff
  makeDiff,
  makePatches,
  // Match
  match,
  parsePatch,
  stringifyPatches,
} from './index.js'

test('diff api', () => {
  const diffs = makeDiff('from this', 'to this')
  expect(diffs).toEqual([
    [DIFF_DELETE, 'fr'],
    [DIFF_INSERT, 't'],
    [DIFF_EQUAL, 'o'],
    [DIFF_DELETE, 'm'],
    [DIFF_EQUAL, ' this'],
  ])

  expect(cleanupSemantic(diffs)).toEqual([
    [DIFF_DELETE, 'from'],
    [DIFF_INSERT, 'to'],
    [DIFF_EQUAL, ' this'],
  ])

  expect(
    cleanupEfficiency([
      [DIFF_DELETE, 'ab'],
      [DIFF_INSERT, '12'],
      [DIFF_EQUAL, 'xyz'],
      [DIFF_DELETE, 'cd'],
      [DIFF_INSERT, '34'],
    ]),
  ).toEqual([
    [DIFF_DELETE, 'abxyzcd'],
    [DIFF_INSERT, '12xyz34'],
  ])
})

test('match api', () => {
  expect(match('I am the very model of a modern major general.', ' that berry ', 5)).toBe(4)
})

test('patch api', () => {
  const patches = makePatches('from this', 'to this')
  expect(patches).toEqual([
    {
      diffs: [
        [DIFF_DELETE, 'from'],
        [DIFF_INSERT, 'to'],
        [DIFF_EQUAL, ' thi'],
      ],
      utf8Length1: 8,
      utf8Length2: 6,
      length1: 8,
      length2: 6,
      start1: 0,
      start2: 0,
      utf8Start1: 0,
      utf8Start2: 0,
    },
  ])

  const stringified = stringifyPatches(patches)
  expect(stringified).toEqual('@@ -1,8 +1,6 @@\n-from\n+to\n  thi\n')

  const [newValue, success] = applyPatches(patches, 'from this')
  expect(newValue).toBe('to this')
  expect(success).toEqual([true])

  const [newValueFromString, stringifiedSuccess] = applyPatches(
    parsePatch(stringified),
    'from this',
  )
  expect(newValueFromString).toBe('to this')
  expect(stringifiedSuccess).toEqual([true])
})
