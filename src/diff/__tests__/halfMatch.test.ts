import {test, expect} from 'vitest'
import {halfMatch_} from '../halfMatch.js'

test('halfMatch', () => {
  // Detect a halfmatch.
  // No match.
  expect(halfMatch_('1234567890', 'abcdef')).toBe(null)

  expect(halfMatch_('12345', '23')).toBe(null)

  // Single Match.
  expect(halfMatch_('1234567890', 'a345678z')).toEqual(['12', '90', 'a', 'z', '345678'])

  expect(halfMatch_('a345678z', '1234567890')).toEqual(['a', 'z', '12', '90', '345678'])

  expect(halfMatch_('abc56789z', '1234567890')).toEqual(['abc', 'z', '1234', '0', '56789'])

  expect(halfMatch_('a23456xyz', '1234567890')).toEqual(['a', 'xyz', '1', '7890', '23456'])

  // Multiple Matches.
  expect(halfMatch_('121231234123451234123121', 'a1234123451234z')).toEqual([
    '12123',
    '123121',
    'a',
    'z',
    '1234123451234',
  ])

  expect(halfMatch_('x-=-=-=-=-=-=-=-=-=-=-=-=', 'xx-=-=-=-=-=-=-=')).toEqual([
    '',
    '-=-=-=-=-=',
    'x',
    '',
    'x-=-=-=-=-=-=-=',
  ])

  expect(halfMatch_('-=-=-=-=-=-=-=-=-=-=-=-=y', '-=-=-=-=-=-=-=yy')).toEqual([
    '-=-=-=-=-=',
    '',
    '',
    'y',
    '-=-=-=-=-=-=-=y',
  ])

  // Non-optimal halfmatch.
  // Optimal diff would be -q+x=H-i+e=lloHe+Hu=llo-Hew+y not -qHillo+x=HelloHe-w+Hulloy
  expect(halfMatch_('qHilloHelloHew', 'xHelloHeHulloy')).toEqual([
    'qHillo',
    'w',
    'x',
    'Hulloy',
    'HelloHe',
  ])

  expect(null).toBe(halfMatch_('qHilloHelloHew', 'xHelloHeHulloy', 0))
})
