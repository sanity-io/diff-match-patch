import {test, expect} from 'vitest'
import {bisect_} from '../bisect.js'
import {DiffType} from '../diff.js'

test('bisect', () => {
  // Normal.
  const a = 'cat'
  const b = 'map'
  // Since the resulting diff hasn't been normalized, it would be ok if
  // the insertion and deletion pairs are swapped.
  // If the order changes, tweak this test as required.
  expect(bisect_(a, b, Number.MAX_VALUE)).toEqual([
    [DiffType.DELETE, 'c'],
    [DiffType.INSERT, 'm'],
    [DiffType.EQUAL, 'a'],
    [DiffType.DELETE, 't'],
    [DiffType.INSERT, 'p'],
  ])

  // Timeout.
  expect(bisect_(a, b, 0)).toEqual([
    [DiffType.DELETE, 'cat'],
    [DiffType.INSERT, 'map'],
  ])
})
