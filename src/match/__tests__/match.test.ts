import {describe, expect, test} from 'vitest'

import {match} from '../match.js'

describe('match', () => {
  test('Full match', () => {
    expect(match('abcdef', 'abcdef', 1000)).toBe(0)
  })

  test('Shortcut matches', () => {
    expect(match('', 'abcdef', 1)).toBe(-1)
    expect(match('abcdef', '', 3)).toBe(3)
    expect(match('abcdef', 'de', 3)).toBe(3)
  })

  test('Beyond end match', () => {
    expect(match('abcdef', 'defy', 4)).toBe(3)
  })

  test('Oversized pattern', () => {
    expect(match('abcdef', 'abcdefy', 0)).toBe(0)
  })

  test('Complex match', () => {
    expect(match('I am the very model of a modern major general.', ' that berry ', 5)).toBe(4)
  })

  test('Test null inputs', () => {
    // @ts-expect-error Incorrect input types, but for JS compatibility
    expect(() => match(null, null, 0)).toThrowError(/null input/i)
  })
})
