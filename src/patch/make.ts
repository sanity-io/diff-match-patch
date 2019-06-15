import { _cleanupSemantic } from '../diff/cleanup'
import { cleanupEfficiency } from '../diff/cleanupEfficiency'
import { Diff, diff, DiffType } from '../diff/diff'
import { diff_text1 } from '../diff/text1'
import { MAX_BITS } from './constants'
import { createPatchObject, Patch } from './createPatchObject'

// Chunk size for context length.
const PATCH_MARGIN = 4

/**
 * Compute a list of patches to turn text1 into text2.
 * Use diffs if provided, otherwise compute it ourselves.
 * There are four ways to call this function, depending on what data is
 * available to the caller:
 * Method 1:
 * a = text1, b = text2
 * Method 2:
 * a = diffs
 * Method 3 (optimal):
 * a = text1, b = diffs
 *
 * @param {string|!Array.<!diff_match_patch.Diff>} a text1 (methods 1,3,4) or
 * Array of diff tuples for text1 to text2 (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} arg text2 (methods 1,4) or
 * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} opt_c Array of diff tuples
 */
export function make(diffs: Diff[]): Patch[]
export function make(text1: string, arg2: string | Diff[]): Patch[]
export function make(a: any, b?: any): Patch[] {
  let text1
  let diffs
  if (typeof a === 'string' && typeof b === 'string') {
    // Method 1: text1, text2
    // Compute diffs from text1 and text2.
    diffs = diff(a, b, true)
    if (diffs.length > 2) {
      _cleanupSemantic(diffs)
      cleanupEfficiency(diffs)
    }
  } else if (a && Array.isArray(a) && typeof b === 'undefined') {
    // Method 2: diffs
    // Compute text1 from diffs.
    text1 = diff_text1(a)
  } else if (typeof a === 'string' && Array.isArray(b)) {
    // Method 3: text1, diffs
    text1 = a
    diffs = b
  } else {
    throw new Error('Unknown call format to patch_make.')
  }

  if (diffs.length === 0) {
    return [] // Get rid of the null case.
  }
  const patches = []
  let patch = createPatchObject()
  let patchDiffLength = 0 // Keeping our own length var is faster in JS.
  let charCount1 = 0 // Number of characters into the text1 string.
  let charCount2 = 0 // Number of characters into the text2 string.
  // Start with text1 (prepatch_text) and apply the diffs until we arrive at
  // text2 (postpatch_text).  We recreate the patches one by one to determine
  // context info.
  let prepatchText = text1
  let postpatchText = text1
  for (let x = 0; x < diffs.length; x++) {
    const diffType = diffs[x][0]
    const diffText = diffs[x][1]

    if (!patchDiffLength && diffType !== DiffType.EQUAL) {
      // A new patch starts here.
      patch.start1 = charCount1
      patch.start2 = charCount2
    }

    switch (diffType) {
      case DiffType.INSERT:
        patch.diffs[patchDiffLength++] = diffs[x]
        patch.length2 += diffText.length
        postpatchText =
          postpatchText.substring(0, charCount2) +
          diffText +
          postpatchText.substring(charCount2)
        break
      case DiffType.DELETE:
        patch.length1 += diffText.length
        patch.diffs[patchDiffLength++] = diffs[x]
        postpatchText =
          postpatchText.substring(0, charCount2) +
          postpatchText.substring(charCount2 + diffText.length)
        break
      case DiffType.EQUAL:
        if (
          diffText.length <= 2 * PATCH_MARGIN &&
          patchDiffLength &&
          diffs.length !== x + 1
        ) {
          // Small equality inside a patch.
          patch.diffs[patchDiffLength++] = diffs[x]
          patch.length1 += diffText.length
          patch.length2 += diffText.length
        } else if (diffText.length >= 2 * PATCH_MARGIN) {
          // Time for a new patch.
          if (patchDiffLength) {
            addContext_(patch, prepatchText)
            patches.push(patch)
            patch = createPatchObject()
            patchDiffLength = 0
            // Unlike Unidiff, our patch lists have a rolling context.
            // http://code.google.com/p/google-diff-match-patch/wiki/Unidiff
            // Update prepatch text & pos to reflect the application of the
            // just completed patch.
            prepatchText = postpatchText
            charCount1 = charCount2
          }
        }
        break
    }

    // Update the current character count.
    if (diffType !== DiffType.INSERT) {
      charCount1 += diffText.length
    }
    if (diffType !== DiffType.DELETE) {
      charCount2 += diffText.length
    }
  }
  // Pick up the leftover patch if not empty.
  if (patchDiffLength) {
    addContext_(patch, prepatchText)
    patches.push(patch)
  }

  return patches
}

/**
 * Increase the context until it is unique,
 * but don't let the pattern expand beyond MAX_BITS.
 * @param {!diff_match_patch.patch_obj} patch The patch to grow.
 * @param {string} text Source text.
 * @private
 */

function addContext_(patch, text) {
  if (text.length === 0) {
    return
  }
  let pattern = text.substring(patch.start2, patch.start2 + patch.length1)
  let padding = 0

  // Look for the first and last matches of pattern in text.  If two different
  // matches are found, increase the pattern length.
  while (
    text.indexOf(pattern) !== text.lastIndexOf(pattern) &&
    pattern.length < MAX_BITS - PATCH_MARGIN - PATCH_MARGIN
  ) {
    padding += PATCH_MARGIN
    pattern = text.substring(
      patch.start2 - padding,
      patch.start2 + patch.length1 + padding,
    )
  }
  // Add one chunk for good luck.
  padding += PATCH_MARGIN

  // Add the prefix.
  const prefix = text.substring(patch.start2 - padding, patch.start2)
  if (prefix) {
    patch.diffs.unshift([DiffType.EQUAL, prefix])
  }
  // Add the suffix.
  const suffix = text.substring(
    patch.start2 + patch.length1,
    patch.start2 + patch.length1 + padding,
  )
  if (suffix) {
    patch.diffs.push([DiffType.EQUAL, suffix])
  }

  // Roll back the start points.
  patch.start1 -= prefix.length
  patch.start2 -= prefix.length
  // Extend the lengths.
  patch.length1 += prefix.length + suffix.length
  patch.length2 += prefix.length + suffix.length
}
