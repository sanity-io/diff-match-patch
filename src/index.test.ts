import {
  // Diff
  makeDiff,
  DiffType,
  cleanupSemantic,
  cleanupEfficiency,

  // Match
  match,

  // Patch
  makePatches,
  applyPatches,
} from './index'

test('diff api', () => {
  const diffs = makeDiff('from this', 'to this')
  expect(diffs).toEqual([
    [DiffType.DELETE, 'fr'],
    [DiffType.INSERT, 't'],
    [DiffType.EQUAL, 'o'],
    [DiffType.DELETE, 'm'],
    [DiffType.EQUAL, ' this'],
  ])

  expect(cleanupSemantic(diffs)).toEqual([
    [DiffType.DELETE, 'from'],
    [DiffType.INSERT, 'to'],
    [DiffType.EQUAL, ' this'],
  ])

  expect(
    cleanupEfficiency([
      [DiffType.DELETE, 'ab'],
      [DiffType.INSERT, '12'],
      [DiffType.EQUAL, 'xyz'],
      [DiffType.DELETE, 'cd'],
      [DiffType.INSERT, '34'],
    ]),
  ).toEqual([
    [DiffType.DELETE, 'abxyzcd'],
    [DiffType.INSERT, '12xyz34'],
  ])
})

test('match api', () => {
  expect(
    match('I am the very model of a modern major general.', ' that berry ', 5),
  ).toBe(4)
})

test('patch api', () => {
  const patches = makePatches('from this', 'to this')
  expect(patches).toEqual([
    {
      diffs: [
        [DiffType.DELETE, 'from'],
        [DiffType.INSERT, 'to'],
        [DiffType.EQUAL, ' thi'],
      ],
      length1: 8,
      length2: 6,
      start1: 0,
      start2: 0,
    },
  ])

  const [newValue, success] = applyPatches(patches, 'from this')
  expect(newValue).toBe('to this')
  expect(success).toEqual([true])
})
