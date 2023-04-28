import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff/diff.js'
import {diffText1, diffText2} from '../diff/diffText.js'
import {DEFAULT_MARGIN, MAX_BITS} from './constants.js'
import {createPatchObject, type Patch} from './createPatchObject.js'

/**
 * Look through the patches and break up any which are longer than the maximum
 * limit of the match algorithm.
 * Intended to be called only from within patch_apply.
 *
 * @param patches - Array of Patch objects.
 * @internal
 */
export function splitMax(patches: Patch[], margin: number = DEFAULT_MARGIN): void {
  const patchSize = MAX_BITS
  for (let x = 0; x < patches.length; x++) {
    if (patches[x].length1 <= patchSize) {
      continue
    }
    const bigpatch = patches[x]
    // Remove the big old patch.
    patches.splice(x--, 1)
    let start1 = bigpatch.start1
    let start2 = bigpatch.start2
    let precontext = ''
    while (bigpatch.diffs.length !== 0) {
      // Create one of several smaller patches.
      const patch = createPatchObject(start1 - precontext.length, start2 - precontext.length)
      let empty = true

      if (precontext !== '') {
        patch.length1 = precontext.length
        patch.length2 = precontext.length
        patch.diffs.push([DIFF_EQUAL, precontext])
      }
      while (bigpatch.diffs.length !== 0 && patch.length1 < patchSize - margin) {
        const diffType = bigpatch.diffs[0][0]
        let diffText = bigpatch.diffs[0][1]
        if (diffType === DIFF_INSERT) {
          // Insertions are harmless.
          patch.length2 += diffText.length
          start2 += diffText.length
          const diff = bigpatch.diffs.shift()
          if (diff) {
            patch.diffs.push(diff)
          }
          empty = false
        } else if (
          diffType === DIFF_DELETE &&
          patch.diffs.length === 1 &&
          patch.diffs[0][0] === DIFF_EQUAL &&
          diffText.length > 2 * patchSize
        ) {
          // This is a large deletion.  Let it pass in one chunk.
          patch.length1 += diffText.length
          start1 += diffText.length
          empty = false
          patch.diffs.push([diffType, diffText])
          bigpatch.diffs.shift()
        } else {
          // Deletion or equality.  Only take as much as we can stomach.
          diffText = diffText.substring(0, patchSize - patch.length1 - margin)
          patch.length1 += diffText.length
          start1 += diffText.length
          if (diffType === DIFF_EQUAL) {
            patch.length2 += diffText.length
            start2 += diffText.length
          } else {
            empty = false
          }
          patch.diffs.push([diffType, diffText])
          if (diffText === bigpatch.diffs[0][1]) {
            bigpatch.diffs.shift()
          } else {
            bigpatch.diffs[0][1] = bigpatch.diffs[0][1].substring(diffText.length)
          }
        }
      }
      // Compute the head context for the next patch.
      precontext = diffText2(patch.diffs)
      precontext = precontext.substring(precontext.length - margin)
      // Append the end context for this patch.
      const postcontext = diffText1(bigpatch.diffs).substring(0, margin)
      if (postcontext !== '') {
        patch.length1 += postcontext.length
        patch.length2 += postcontext.length
        if (patch.diffs.length !== 0 && patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
          patch.diffs[patch.diffs.length - 1][1] += postcontext
        } else {
          patch.diffs.push([DIFF_EQUAL, postcontext])
        }
      }
      if (!empty) {
        patches.splice(++x, 0, patch)
      }
    }
  }
}
