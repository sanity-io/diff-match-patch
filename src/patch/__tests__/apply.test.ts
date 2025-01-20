import {describe, expect, test} from 'vitest'

import {apply} from '../apply.js'
import {make} from '../make.js'
import {stringify} from '../stringify.js'

describe('apply', () => {
  test('null case', () => {
    const patches = make('', '')
    const results = apply(patches, 'Hello world.', {deleteThreshold: 0.5})
    expect(results).toEqual(['Hello world.', []])
  })

  test('exact match', () => {
    const patches = make(
      'The quick brown fox jumps over the lazy dog.',
      'That quick brown fox jumped over a lazy dog.',
    )
    const results = apply(patches, 'The quick brown fox jumps over the lazy dog.')
    expect(results).toEqual(['That quick brown fox jumped over a lazy dog.', [true, true]])
  })

  test('partial match', () => {
    const patches = make(
      'The quick brown fox jumps over the lazy dog.',
      'That quick brown fox jumped over a lazy dog.',
    )
    const results = apply(patches, 'The quick red rabbit jumps over the tired tiger.')
    expect(results).toEqual(['That quick red rabbit jumped over a tired tiger.', [true, true]])
  })

  test('failed match', () => {
    const patches = make(
      'The quick brown fox jumps over the lazy dog.',
      'That quick brown fox jumped over a lazy dog.',
    )
    const results = apply(patches, 'I am the very model of a modern major general.')
    expect(results).toEqual(['I am the very model of a modern major general.', [false, false]])
  })

  test('Big delete, small change.', () => {
    const patches = make(
      'x1234567890123456789012345678901234567890123456789012345678901234567890y',
      'xabcy',
    )
    const results = apply(
      patches,
      'x123456789012345678901234567890-----++++++++++-----123456789012345678901234567890y',
    )
    expect(results).toEqual(['xabcy', [true, true]])
  })

  test('Big delete, big change 1.', () => {
    const patches = make(
      'x1234567890123456789012345678901234567890123456789012345678901234567890y',
      'xabcy',
    )
    const results = apply(
      patches,
      'x12345678901234567890---------------++++++++++---------------12345678901234567890y',
    )
    expect(results).toEqual([
      'xabc12345678901234567890---------------++++++++++---------------12345678901234567890y',
      [false, true],
    ])
  })

  test('Big delete, big change 2.', () => {
    const patches = make(
      'x1234567890123456789012345678901234567890123456789012345678901234567890y',
      'xabcy',
    )
    const results = apply(
      patches,
      'x12345678901234567890---------------++++++++++---------------12345678901234567890y',
      {deleteThreshold: 0.6},
    )
    expect(results).toEqual(['xabcy', [true, true]])
  })

  test('Compensate for failed patch.', () => {
    const patches = make(
      'abcdefghijklmnopqrstuvwxyz--------------------1234567890',
      'abcXXXXXXXXXXdefghijklmnopqrstuvwxyz--------------------1234567YYYYYYYYYY890',
    )
    const results = apply(patches, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ--------------------1234567890', {
      deleteThreshold: 0.5,
    })
    expect(results).toEqual([
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ--------------------1234567YYYYYYYYYY890',
      [false, true],
    ])
  })

  test('No side effects.', () => {
    const patches = make('', 'test')
    const patchstr = stringify(patches)
    apply(patches, '')
    expect(stringify(patches)).toBe(patchstr)
  })

  test('No side effects with major delete.', () => {
    const patches = make('The quick brown fox jumps over the lazy dog.', 'Woof')

    // No side-effects in stringify
    const preStringify = JSON.stringify(patches)
    const patchstr = stringify(patches)
    expect(JSON.stringify(patches)).toBe(preStringify)
    expect(stringify(patches)).toBe(patchstr)

    // No side-effects in apply
    apply(patches, 'The quick brown fox jumps over the lazy dog.')
    expect(JSON.stringify(patches)).toBe(preStringify)
    expect(stringify(patches)).toBe(patchstr)
  })

  test('Edge exact match.', () => {
    const patches = make('', 'test')
    const results = apply(patches, '')
    expect(results).toEqual(['test', [true]])
  })

  test('Near edge exact match.', () => {
    const patches = make('XY', 'XtestY')
    const results = apply(patches, 'XY')
    expect(results).toEqual(['XtestY', [true]])
  })

  test('Edge partial match.', () => {
    const patches = make('y', 'y123')
    const results = apply(patches, 'x')
    expect(results).toEqual(['x123', [true]])
  })

  test('Can pass options.', () => {
    const patches = make('y', 'y123')
    const results = apply(patches, 'x', {allowExceedingIndices: true})
    expect(results).toEqual(['x123', [true]])
  })
})
