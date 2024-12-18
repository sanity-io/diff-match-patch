import {describe, expect, test} from 'vitest'

import {diff, DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../../diff/diff.js'
import {toDelta} from '../../diff/toDelta.js'
import {apply} from '../apply.js'
import {make} from '../make.js'
import {parse} from '../parse.js'
import {stringify} from '../stringify.js'

describe('surrogate pairs', () => {
  test(`share the same high surrogate prefix`, () => {
    const p = make('\u{1F30D}', '\u{1F308}')
    const strp = stringify(p)
    const p2 = parse(strp)
    expect(p).toEqual(p2)
  })

  test(`share the same low surrogate suffix`, () => {
    const p = make('\u{10120}', '\u{10520}')
    const strp = stringify(p)
    const p2 = parse(strp)
    expect(p).toEqual(p2)
  })

  test(`no common prefix, but later there's the same high surrogate char`, () => {
    const p = make('abbb\u{1F30D}', 'cbbb\u{1F308}')
    const strp = stringify(p)
    const p2 = parse(strp)
    expect(p).toEqual(p2)
  })

  test(`no common suffix, but earlier there's the same low surrogate char`, () => {
    const p = make('\u{10120}aaac', '\u{10520}aaab')
    const strp = stringify(p)
    const p2 = parse(strp)
    expect(p).toEqual(p2)
  })

  test(`no common suffix, but earlier there's the same low surrogate char`, () => {
    const p = make('abbb\u{10120}aaac', '\u{10520}aaab')
    const strp = stringify(p)
    const p2 = parse(strp)
    expect(p).toEqual(p2)
  })
})

test('surrogate pairs: random edits', () => {
  const originalText = `U+1F17x	🅰️	🅱️		🅾️	🅿️ safhawifhkw
    U+1F18x															🆎	
    0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F
    U+1F19x		🆑	🆒	🆓	🆔	🆕	🆖	🆗	🆘	🆙	🆚					
    U+1F20x		🈁	🈂️							sfss.,_||saavvvbbds						
    U+1F21x	🈚					
    U+1F22x			🈯
    U+1F23x			🈲	🈳	🈴	🈵	🈶	🈷️	🈸	🈹	🈺					
    U+1F25x	🉐	🉑		
    U+1F30x	🌀	🌁	🌂	🌃	🌄	🌅	🌆	🌇	🌈	🌉	🌊	🌋	🌌	🌍	🌎	🌏
    U+1F31x	🌐	🌑	🌒	🌓	🌔	🌕	🌖	🌗	🌘	🌙	🌚	🌛	🌜	🌝	🌞	`

  // applies some random edits to string and returns new, edited string
  function applyRandomTextEdit(text: string) {
    const textArr = [...text]
    const r = Math.random()
    if (r < 1 / 3) {
      // swap
      const swapCount = Math.floor(Math.random() * 5)
      for (let i = 0; i < swapCount; i++) {
        const swapPos1 = Math.floor(Math.random() * textArr.length)
        const swapPos2 = Math.floor(Math.random() * textArr.length)
        const char1 = textArr[swapPos1]
        const char2 = textArr[swapPos2]
        textArr[swapPos1] = char2
        textArr[swapPos2] = char1
      }
    } else if (r < 2 / 3) {
      // remove
      const removeCount = Math.floor(Math.random() * 5)
      for (let i = 0; i < removeCount; i++) {
        const removePos = Math.floor(Math.random() * textArr.length)
        textArr[removePos] = ''
      }
    } else {
      // add
      const addCount = Math.floor(Math.random() * 5)
      for (let i = 0; i < addCount; i++) {
        const addPos = Math.floor(Math.random() * textArr.length)
        const addFromPos = Math.floor(Math.random() * textArr.length)
        textArr[addPos] += textArr[addFromPos]
      }
    }
    return textArr.join('')
  }

  for (let i = 0; i < 1000; i++) {
    const newText = applyRandomTextEdit(originalText)
    expect(typeof toDelta(diff(originalText, newText))).toBe('string')
  }
})

// Unicode - splitting surrogates
describe('surrogate pairs splitting', () => {
  test('insert similar surrogate pair at beginning', () => {
    expect(diff('\ud83c\udd70\ud83c\udd71', '\ud83c\udd71\ud83c\udd70\ud83c\udd71')).toEqual([
      [DIFF_INSERT, '\ud83c\udd71'],
      [DIFF_EQUAL, '\ud83c\udd70\ud83c\udd71'],
    ])
  })

  test('inserting similar surrogate pair in the middle', () => {
    expect(diff('\ud83c\udd70\ud83c\udd71', '\ud83c\udd70\ud83c\udd70\ud83c\udd71')).toEqual([
      [DIFF_EQUAL, '\ud83c\udd70'],
      [DIFF_INSERT, '\ud83c\udd70'],
      [DIFF_EQUAL, '\ud83c\udd71'],
    ])
  })

  test('deleting similar surrogate pair at the beginning', () => {
    expect(diff('\ud83c\udd71\ud83c\udd70\ud83c\udd71', '\ud83c\udd70\ud83c\udd71')).toEqual([
      [DIFF_DELETE, '\ud83c\udd71'],
      [DIFF_EQUAL, '\ud83c\udd70\ud83c\udd71'],
    ])
  })

  test('deleting similar surrogate pair in the middle', () => {
    expect(diff('\ud83c\udd70\ud83c\udd72\ud83c\udd71', '\ud83c\udd70\ud83c\udd71')).toEqual([
      [DIFF_EQUAL, '\ud83c\udd70'],
      [DIFF_DELETE, '\ud83c\udd72'],
      [DIFF_EQUAL, '\ud83c\udd71'],
    ])
  })

  test('swap surrogate pair', () => {
    expect(diff('\ud83c\udd70', '\ud83c\udd71')).toEqual([
      [DIFF_DELETE, '\ud83c\udd70'],
      [DIFF_INSERT, '\ud83c\udd71'],
    ])
  })

  test.each([
    [
      'Honestly? I thought it was total 😉, really.',
      'Honestly? I thought it was total 😀, really.',
    ],
    ['Jeg skriver litt tekst. Med emojis! 😅 Gøy', 'Jeg skriver litt tekst. Med emojis! 😅 Gø'],
    ['Jeg skriver litt tekst. Med emojis! 😅 Gø', 'Jeg skriver litt tekst. Med emojis! 😅 Gøy'],
    ['Gøy 😅', 'øy 😅'],
  ])('stringified/non-stringified, reapplied', (source, target) => {
    const patch = make(source, target)
    let result = apply(patch, source)[0]
    expect(result).toBe(target)

    const strPatch = stringify(patch)
    const parsed = parse(strPatch)
    result = apply(parsed, source)[0]
    expect(result).toBe(target)
  })
})
