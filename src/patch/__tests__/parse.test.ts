import {test, expect, describe} from 'vitest'
import {parse} from '../parse.js'
import {stringifyPatch, stringify} from '../stringify.js'

describe('parse', () => {
  test('empty', () => {
    expect(parse('')).toEqual([])
  })

  test('parse and stringify equality: a', () => {
    const strp = '@@ -21,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n %0Alaz\n'
    const parsed = parse(strp)
    expect(stringifyPatch(parsed[0])).toBe(strp)
    expect(stringify(parsed)).toBe(strp)
  })

  test('parse and stringify equality: b', () => {
    const strp = '@@ -1 +1 @@\n-a\n+b\n'
    const parsed = parse(strp)
    expect(stringifyPatch(parsed[0])).toBe(strp)
    expect(stringify(parsed)).toBe(strp)
  })

  test('parse and stringify equality: c', () => {
    const strp = '@@ -1,3 +0,0 @@\n-abc\n'
    const parsed = parse(strp)
    expect(stringifyPatch(parsed[0])).toBe(strp)
    expect(stringify(parsed)).toBe(strp)
  })

  test('parse and stringify equality: d', () => {
    const strp = '@@ -0,0 +1,3 @@\n+abc\n'
    const parsed = parse(strp)
    expect(stringifyPatch(parsed[0])).toBe(strp)
    expect(stringify(parsed)).toBe(strp)
  })

  test('parse and stringify: unicode', () => {
    const strp = '@@ -8,9 +8,10 @@\n lir \n-g%C3%B8y\n+kjipt\n .\n'
    const parsed = parse(strp)
    expect(stringifyPatch(parsed[0])).toBe(strp)
    expect(stringify(parsed)).toBe(strp)
  })

  test('batch patches', () => {
    expect(() => parse('Bad\nPatch\n')).toThrowError(/invalid patch/i)
  })
})
