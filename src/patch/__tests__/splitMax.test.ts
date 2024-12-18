import {test, expect, describe} from 'vitest'
import {make} from '../make.js'
import {splitMax} from '../splitMax.js'
import {stringify} from '../stringify.js'

// Assumes that dmp.Match_MaxBits is 32.
describe('splitMax', () => {
  test('base', () => {
    const patches = make(
      'abcdefghijklmnopqrstuvwxyz01234567890',
      'XabXcdXefXghXijXklXmnXopXqrXstXuvXwxXyzX01X23X45X67X89X0',
    )
    splitMax(patches)
    expect(stringify(patches)).toBe(
      '@@ -1,32 +1,46 @@\n+X\n ab\n+X\n cd\n+X\n ef\n+X\n gh\n+X\n ij\n+X\n kl\n+X\n mn\n+X\n op\n+X\n qr\n+X\n st\n+X\n uv\n+X\n wx\n+X\n yz\n+X\n 012345\n@@ -25,13 +39,18 @@\n zX01\n+X\n 23\n+X\n 45\n+X\n 67\n+X\n 89\n+X\n 0\n',
    )
  })

  test('early match', () => {
    const patches = make(
      'abcdef1234567890123456789012345678901234567890123456789012345678901234567890uvwxyz',
      'abcdefuvwxyz',
    )
    const oldToText = stringify(patches)
    splitMax(patches)
    expect(stringify(patches)).toBe(oldToText)
  })

  test('no match', () => {
    const patches = make(
      '1234567890123456789012345678901234567890123456789012345678901234567890',
      'abc',
    )
    splitMax(patches)
    expect(stringify(patches)).toBe(
      '@@ -1,32 +1,4 @@\n-1234567890123456789012345678\n 9012\n@@ -29,32 +1,4 @@\n-9012345678901234567890123456\n 7890\n@@ -57,14 +1,3 @@\n-78901234567890\n+abc\n',
    )
  })

  test('two matches, separated', () => {
    const patches = make(
      'abcdefghij , h : 0 , t : 1 abcdefghij , h : 0 , t : 1 abcdefghij , h : 0 , t : 1',
      'abcdefghij , h : 1 , t : 1 abcdefghij , h : 1 , t : 1 abcdefghij , h : 0 , t : 1',
    )
    splitMax(patches)
    expect(stringify(patches)).toBe(
      '@@ -2,32 +2,32 @@\n bcdefghij , h : \n-0\n+1\n  , t : 1 abcdef\n@@ -29,32 +29,32 @@\n bcdefghij , h : \n-0\n+1\n  , t : 1 abcdef\n',
    )
  })
})
