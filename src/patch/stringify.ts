import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff/diff.js'
import {Patch} from './createPatchObject.js'

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
 * Create a textual representation of a patch.
 *
 * @param patch - Patch to stringify
 * @returns Text representation of patch
 * @public
 */
export function stringifyPatch(patch: Patch): string {
  let coords1
  let coords2
  if (patch.length1 === 0) {
    coords1 = `${patch.start1},0`
  } else if (patch.length1 === 1) {
    coords1 = patch.start1 + 1
  } else {
    coords1 = `${patch.start1 + 1},${patch.length1}`
  }
  if (patch.length2 === 0) {
    coords2 = `${patch.start2},0`
  } else if (patch.length2 === 1) {
    coords2 = patch.start2 + 1
  } else {
    coords2 = `${patch.start2 + 1},${patch.length2}`
  }
  const text = [`@@ -${coords1} +${coords2} @@\n`]
  let op
  // Escape the body of the patch with %xx notation.
  for (let x = 0; x < patch.diffs.length; x++) {
    switch (patch.diffs[x][0]) {
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
    text[x + 1] = `${op + encodeURI(patch.diffs[x][1])}\n`
  }
  return text.join('').replace(/%20/g, ' ')
}
