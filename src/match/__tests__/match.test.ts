import { match } from '../match'

test('match', () => {
  // Full match.
  // Shortcut matches.
  expect(match('abcdef', 'abcdef', 1000)).toBe(0)

  expect(match('', 'abcdef', 1)).toBe(-1)

  expect(match('abcdef', '', 3)).toBe(3)

  expect(match('abcdef', 'de', 3)).toBe(3)

  // Beyond end match.
  expect(match('abcdef', 'defy', 4)).toBe(3)

  // Oversized pattern.
  expect(match('abcdef', 'abcdefy', 0)).toBe(0)

  // Complex match.
  expect(
    match('I am the very model of a modern major general.', ' that berry ', 5),
  ).toBe(4)

  // Test null inputs.
  // @ts-expect-error
  expect(() => match(null, null, 0)).toThrowError(/null input/i)
})
