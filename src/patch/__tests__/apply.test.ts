import {test, expect} from 'vitest'
import {apply} from '../apply.js'
import {make} from '../make.js'
import {stringify} from '../stringify.js'

test('apply', () => {
  // Null case.
  let patches = make('', '')
  let results = apply(patches, 'Hello world.', {deleteThreshold: 0.5})
  expect(results).toEqual(['Hello world.', []])

  // Exact match.
  patches = make(
    'The quick brown fox jumps over the lazy dog.',
    'That quick brown fox jumped over a lazy dog.'
  )
  results = apply(patches, 'The quick brown fox jumps over the lazy dog.')
  expect(results).toEqual(['That quick brown fox jumped over a lazy dog.', [true, true]])

  // Partial match.
  results = apply(patches, 'The quick red rabbit jumps over the tired tiger.')
  expect(results).toEqual(['That quick red rabbit jumped over a tired tiger.', [true, true]])

  // Failed match.
  results = apply(patches, 'I am the very model of a modern major general.')
  expect(results).toEqual(['I am the very model of a modern major general.', [false, false]])

  // Big delete, small change.
  patches = make(
    'x1234567890123456789012345678901234567890123456789012345678901234567890y',
    'xabcy'
  )
  results = apply(
    patches,
    'x123456789012345678901234567890-----++++++++++-----123456789012345678901234567890y'
  )
  expect(results).toEqual(['xabcy', [true, true]])

  // Big delete, big change 1.
  patches = make(
    'x1234567890123456789012345678901234567890123456789012345678901234567890y',
    'xabcy'
  )
  results = apply(
    patches,
    'x12345678901234567890---------------++++++++++---------------12345678901234567890y'
  )
  expect(results).toEqual([
    'xabc12345678901234567890---------------++++++++++---------------12345678901234567890y',
    [false, true],
  ])

  // Big delete, big change 2.
  patches = make(
    'x1234567890123456789012345678901234567890123456789012345678901234567890y',
    'xabcy'
  )
  results = apply(
    patches,
    'x12345678901234567890---------------++++++++++---------------12345678901234567890y',
    {deleteThreshold: 0.6}
  )
  expect(results).toEqual(['xabcy', [true, true]])

  // Compensate for failed patch.
  patches = make(
    'abcdefghijklmnopqrstuvwxyz--------------------1234567890',
    'abcXXXXXXXXXXdefghijklmnopqrstuvwxyz--------------------1234567YYYYYYYYYY890'
  )
  results = apply(patches, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ--------------------1234567890', {
    deleteThreshold: 0.5,
  })
  expect(results).toEqual([
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ--------------------1234567YYYYYYYYYY890',
    [false, true],
  ])

  // No side effects.
  patches = make('', 'test')
  let patchstr = stringify(patches)
  apply(patches, '')
  expect(stringify(patches)).toBe(patchstr)

  // No side effects with major delete.
  patches = make('The quick brown fox jumps over the lazy dog.', 'Woof')
  patchstr = stringify(patches)
  apply(patches, 'The quick brown fox jumps over the lazy dog.')
  expect(stringify(patches)).toBe(patchstr)

  // Edge exact match.
  patches = make('', 'test')
  results = apply(patches, '')
  expect(results).toEqual(['test', [true]])

  // Near edge exact match.
  patches = make('XY', 'XtestY')
  results = apply(patches, 'XY')
  expect(results).toEqual(['XtestY', [true]])

  // Edge partial match.
  patches = make('y', 'y123')
  results = apply(patches, 'x')
  expect(results).toEqual(['x123', [true]])

  // From text-formatted patch
  patches = make('abc123', 'xyz123')
  results = apply(stringify(patches), 'abc123')
  expect(results).toEqual(['xyz123', [true]])
})
