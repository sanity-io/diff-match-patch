import {test, expect} from 'vitest'
import {bisect_} from '../bisect.js'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff.js'

test('bisect', () => {
  // Normal.
  const a = 'cat'
  const b = 'map'
  // Since the resulting diff hasn't been normalized, it would be ok if
  // the insertion and deletion pairs are swapped.
  // If the order changes, tweak this test as required.
  expect(bisect_(a, b, Number.MAX_VALUE)).toEqual([
    [DIFF_DELETE, 'c'],
    [DIFF_INSERT, 'm'],
    [DIFF_EQUAL, 'a'],
    [DIFF_DELETE, 't'],
    [DIFF_INSERT, 'p'],
  ])

  // Timeout.
  expect(bisect_(a, b, 0)).toEqual([
    [DIFF_DELETE, 'cat'],
    [DIFF_INSERT, 'map'],
  ])
})
