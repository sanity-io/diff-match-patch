import {describe, expect, test} from 'vitest'
import {findHalfMatch} from '../halfMatch.js'

// Detect a halfmatch.
describe('halfMatch', () => {
  test('No match', () => {
    expect(findHalfMatch('1234567890', 'abcdef')).toBe(null)

    expect(findHalfMatch('12345', '23')).toBe(null)
  })

  test('Single Match', () => {
    expect(findHalfMatch('1234567890', 'a345678z')).toEqual(['12', '90', 'a', 'z', '345678'])

    expect(findHalfMatch('a345678z', '1234567890')).toEqual(['a', 'z', '12', '90', '345678'])

    expect(findHalfMatch('abc56789z', '1234567890')).toEqual(['abc', 'z', '1234', '0', '56789'])

    expect(findHalfMatch('a23456xyz', '1234567890')).toEqual(['a', 'xyz', '1', '7890', '23456'])
  })

  test('Multiple Matches', () => {
    expect(findHalfMatch('121231234123451234123121', 'a1234123451234z')).toEqual([
      '12123',
      '123121',
      'a',
      'z',
      '1234123451234',
    ])

    expect(findHalfMatch('x-=-=-=-=-=-=-=-=-=-=-=-=', 'xx-=-=-=-=-=-=-=')).toEqual([
      '',
      '-=-=-=-=-=',
      'x',
      '',
      'x-=-=-=-=-=-=-=',
    ])

    expect(findHalfMatch('-=-=-=-=-=-=-=-=-=-=-=-=y', '-=-=-=-=-=-=-=yy')).toEqual([
      '-=-=-=-=-=',
      '',
      '',
      'y',
      '-=-=-=-=-=-=-=y',
    ])
  })

  test('Non-optimal halfmatch', () => {
    // Optimal diff would be -q+x=H-i+e=lloHe+Hu=llo-Hew+y not -qHillo+x=HelloHe-w+Hulloy
    expect(findHalfMatch('qHilloHelloHew', 'xHelloHeHulloy')).toEqual([
      'qHillo',
      'w',
      'x',
      'Hulloy',
      'HelloHe',
    ])

    expect(null).toBe(findHalfMatch('qHilloHelloHew', 'xHelloHeHulloy', 0))
  })
})
