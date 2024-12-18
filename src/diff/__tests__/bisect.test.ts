import {describe,expect, test} from 'vitest'

import {bisect} from '../bisect.js'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff.js'

describe('bisect', () => {
  // Normal.
  const a = 'cat'
  const b = 'map'

  test('normal', () => {
    // Since the resulting diff hasn't been normalized, it would be ok if
    // the insertion and deletion pairs are swapped.
    // If the order changes, tweak this test as required.
    expect(bisect(a, b, Number.MAX_VALUE)).toEqual([
      [DIFF_DELETE, 'c'],
      [DIFF_INSERT, 'm'],
      [DIFF_EQUAL, 'a'],
      [DIFF_DELETE, 't'],
      [DIFF_INSERT, 'p'],
    ])
  })

  test('timeout', () => {
    expect(bisect(a, b, 0)).toEqual([
      [DIFF_DELETE, 'cat'],
      [DIFF_INSERT, 'map'],
    ])
  })
})
