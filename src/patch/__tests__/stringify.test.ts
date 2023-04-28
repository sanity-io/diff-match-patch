import {test, expect} from 'vitest'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../../diff/diff.js'
import {createPatchObject} from '../createPatchObject.js'
import {parse} from '../parse.js'
import {stringify, stringifyPatch} from '../stringify.js'

test('stringify', () => {
  let strp = '@@ -21,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n  laz\n'
  expect(stringify(parse(strp))).toBe(strp)

  strp = '@@ -1,9 +1,9 @@\n-f\n+F\n oo+fooba\n@@ -7,9 +7,9 @@\n obar\n-,\n+.\n  tes\n'
  expect(stringify(parse(strp))).toBe(strp)
})

test('stringifyPatch', () => {
  // Patch Object.
  const p = createPatchObject(20, 21)
  p.length1 = 18
  p.utf8Length1 = 18
  p.length2 = 17
  p.utf8Length2 = 17
  p.diffs = [
    [DIFF_EQUAL, 'jump'],
    [DIFF_DELETE, 's'],
    [DIFF_INSERT, 'ed'],
    [DIFF_EQUAL, ' over '],
    [DIFF_DELETE, 'the'],
    [DIFF_INSERT, 'a'],
    [DIFF_EQUAL, '\nlaz'],
  ]
  const strp = stringifyPatch(p)
  expect(strp).toEqual('@@ -21,18 +22,17 @@\n jump\n-s\n+ed\n  over \n-the\n+a\n %0Alaz\n')
})
