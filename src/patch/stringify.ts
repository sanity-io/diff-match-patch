import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff/diff.js'
import type {Patch} from './createPatchObject.js'

/**
 * Create a textual representation of a patch list.
 *
 * @param patches - Patches to stringify
 * @returns Text representation of patches
 * @public
 */
export function stringify(patches: Patch[]): string {
  return patches.map(stringifyPatch).join('')
}

/**
 * Create a textual representation of a
 *
 * @param patch - Patch to stringify
 * @returns Text representation of patch
 * @public
 */
export function stringifyPatch(patch: Patch): string {
  const {byteLength1, byteLength2, start1, start2, diffs} = patch

  let coords1: string
  if (byteLength1 === 0) {
    coords1 = `${start1},0`
  } else if (byteLength1 === 1) {
    coords1 = `${start1 + 1}`
  } else {
    coords1 = `${start1 + 1},${byteLength1}`
  }

  let coords2: string
  if (byteLength2 === 0) {
    coords2 = `${start2},0`
  } else if (byteLength2 === 1) {
    coords2 = `${start2 + 1}`
  } else {
    coords2 = `${start2 + 1},${byteLength2}`
  }

  const text = [`@@ -${coords1} +${coords2} @@\n`]
  let op

  // Escape the body of the patch with %xx notation.
  for (let x = 0; x < diffs.length; x++) {
    switch (diffs[x][0]) {
      case DIFF_INSERT:
        op = '+'
        break
      case DIFF_DELETE:
        op = '-'
        break
      case DIFF_EQUAL:
        op = ' '
        break
      default:
        throw new Error('Unknown patch operation.')
    }
    text[x + 1] = `${op + encodeURI(diffs[x][1])}\n`
  }

  return text.join('').replace(/%20/g, ' ')
}
