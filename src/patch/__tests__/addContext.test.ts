import {describe, expect, test} from 'vitest'

import {addContext} from '../make.js'
import {parse} from '../parse.js'
import {stringifyPatch} from '../stringify.js'

describe('addContext', () => {
  test('basic', () => {
    const p = parse('@@ -21,4 +21,10 @@\n-jump\n+somersault\n')[0]
    addContext(p, 'The quick brown fox jumps over the lazy dog.', {margin: 4})
    expect(stringifyPatch(p)).toBe('@@ -17,12 +17,18 @@\n fox \n-jump\n+somersault\n s ov\n')
  })

  test('Same, but not enough trailing context', () => {
    const p = parse('@@ -21,4 +21,10 @@\n-jump\n+somersault\n')[0]
    addContext(p, 'The quick brown fox jumps.', {margin: 4})
    expect(stringifyPatch(p)).toBe('@@ -17,10 +17,16 @@\n fox \n-jump\n+somersault\n s.\n')
  })

  test('Same, but not enough leading context', () => {
    const p = parse('@@ -3 +3,2 @@\n-e\n+at\n')[0]
    addContext(p, 'The quick brown fox jumps.', {margin: 4})
    expect(stringifyPatch(p)).toBe('@@ -1,7 +1,8 @@\n Th\n-e\n+at\n  qui\n')
  })

  test('Same, but with ambiguity', () => {
    const p = parse('@@ -3 +3,2 @@\n-e\n+at\n')[0]
    addContext(p, 'The quick brown fox jumps.  The quick brown fox crashes.', {
      margin: 4,
    })
    expect(stringifyPatch(p)).toBe('@@ -1,27 +1,28 @@\n Th\n-e\n+at\n  quick brown fox jumps. \n')
  })
})
