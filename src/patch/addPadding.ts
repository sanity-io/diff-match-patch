import {DIFF_EQUAL} from '../diff/diff.js'
import {DEFAULT_MARGIN} from './constants.js'
import type {Patch} from './createPatchObject.js'

/**
 * Add some padding on text start and end so that edges can match something.
 * Intended to be called only from within patch_apply.
 *
 * @param patches - Array of Patch objects.
 * @param margin - The margin length to add.
 * @returns The string, padded on each side.
 * @internal
 */
export function addPadding(patches: Patch[], margin: number = DEFAULT_MARGIN): string {
  const paddingLength = margin
  let nullPadding = ''
  for (let x = 1; x <= paddingLength; x++) {
    nullPadding += String.fromCharCode(x)
  }

  // Bump all the patches forward.
  for (const p of patches) {
    p.start1 += paddingLength
    p.start2 += paddingLength
  }

  // Add some padding on start of first diff.
  let patch = patches[0]
  let diffs = patch.diffs
  if (diffs.length === 0 || diffs[0][0] !== DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.unshift([DIFF_EQUAL, nullPadding])
    patch.start1 -= paddingLength // Should be 0.
    patch.start2 -= paddingLength // Should be 0.
    patch.length1 += paddingLength
    patch.length2 += paddingLength
    patch.byteLength1 += paddingLength
    patch.byteLength2 += paddingLength
  } else if (paddingLength > diffs[0][1].length) {
    // Grow first equality.
    const extraLength = paddingLength - diffs[0][1].length
    diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1]
    patch.start1 -= extraLength
    patch.start2 -= extraLength
    patch.length1 += extraLength
    patch.length2 += extraLength
    patch.byteLength1 += extraLength
    patch.byteLength2 += extraLength
  }

  // Add some padding on end of last diff.
  patch = patches[patches.length - 1]
  diffs = patch.diffs
  if (diffs.length === 0 || diffs[diffs.length - 1][0] !== DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.push([DIFF_EQUAL, nullPadding])
    patch.length1 += paddingLength
    patch.length2 += paddingLength
    patch.byteLength1 += paddingLength
    patch.byteLength2 += paddingLength
  } else if (paddingLength > diffs[diffs.length - 1][1].length) {
    // Grow last equality.
    const extraLength = paddingLength - diffs[diffs.length - 1][1].length
    diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength)
    patch.length1 += extraLength
    patch.length2 += extraLength
    patch.byteLength1 += extraLength
    patch.byteLength2 += extraLength
  }

  return nullPadding
}
