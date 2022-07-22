import { DiffType } from '../diff/diff.js'
import { Patch } from './createPatchObject.js'

export function stringify(patches: Patch[]) {
  return patches.map(stringifyPatch).join('')
}

export function stringifyPatch(patch: Patch) {
  let coords1
  let coords2
  if (patch.length1 === 0) {
    coords1 = patch.start1 + ',0'
  } else if (patch.length1 === 1) {
    coords1 = patch.start1 + 1
  } else {
    coords1 = patch.start1 + 1 + ',' + patch.length1
  }
  if (patch.length2 === 0) {
    coords2 = patch.start2 + ',0'
  } else if (patch.length2 === 1) {
    coords2 = patch.start2 + 1
  } else {
    coords2 = patch.start2 + 1 + ',' + patch.length2
  }
  const text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n']
  let op
  // Escape the body of the patch with %xx notation.
  for (let x = 0; x < patch.diffs.length; x++) {
    switch (patch.diffs[x][0]) {
      case DiffType.INSERT:
        op = '+'
        break
      case DiffType.DELETE:
        op = '-'
        break
      case DiffType.EQUAL:
        op = ' '
        break
    }
    text[x + 1] = op + encodeURI(patch.diffs[x][1]) + '\n'
  }
  return text.join('').replace(/%20/g, ' ')
}
