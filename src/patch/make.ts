import { _cleanupSemantic, cleanupEfficiency } from '../diff/cleanup'
import { diff, Diff, DiffType } from '../diff/diff'
import { diffText1 } from '../diff/diffText'
import { MAX_BITS } from './constants'
import { createPatchObject, Patch } from './createPatchObject'

interface PatchOptions {
  // Chunk size for context length.
  margin: number
}

const DEFAULT_OPTS: PatchOptions = {
  margin: 4,
}

function getDefaultOpts(opts: Partial<PatchOptions> = {}): PatchOptions {
  return {
    ...DEFAULT_OPTS,
    ...opts,
  }
}

export function make(diffs: Diff[], options?: Partial<PatchOptions>): Patch[]
export function make(
  text1: string,
  arg2: string | Diff[],
  options?: Partial<PatchOptions>,
): Patch[]

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
export function make(a: any, b?: any, options?: Partial<PatchOptions>) {
  if (typeof a === 'string' && typeof b === 'string') {
    // Method 1: text1, text2
    // Compute diffs from text1 and text2.
    const diffs = diff(a, b, { checkLines: true })
    if (diffs.length > 2) {
      _cleanupSemantic(diffs)
      cleanupEfficiency(diffs)
    }
    return _make(a, diffs, getDefaultOpts(options))
  }

  if (a && typeof a === 'object' && typeof b === 'undefined') {
    // Method 2: diffs
    // Compute text1 from diffs.
    return _make(diffText1(a), a, getDefaultOpts(options))
  }

  if (typeof a === 'string' && b && typeof b === 'object') {
    // Method 3: text1, diffs
    return _make(a, b, getDefaultOpts(options))
  }

  throw new Error('Unknown call format to make()')
}

function _make(text1: string, diffs: Diff[], options: PatchOptions): Patch[] {
  if (diffs.length === 0) {
    return [] // Get rid of the null case.
  }
  const patches = []
  let patch = createPatchObject(0, 0)
  let patchDiffLength = 0 // Keeping our own length var is faster in JS.
  let charCount1 = 0 // Number of characters into the text1 string.
  let charCount2 = 0 // Number of characters into the text2 string.
  // Start with text1 (prepatchText) and apply the diffs until we arrive at
  // text2 (postpatchText).  We recreate the patches one by one to determine
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
          diffText.length <= 2 * options.margin &&
          patchDiffLength &&
          diffs.length !== x + 1
        ) {
          // Small equality inside a patch.
          patch.diffs[patchDiffLength++] = diffs[x]
          patch.length1 += diffText.length
          patch.length2 += diffText.length
        } else if (diffText.length >= 2 * options.margin) {
          // Time for a new patch.
          if (patchDiffLength) {
            addContext_(patch, prepatchText, options)
            patches.push(patch)
            patch = createPatchObject(-1, -1)
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
    addContext_(patch, prepatchText, options)
    patches.push(patch)
  }

  return patches
}

/**
 * Increase the context until it is unique,
 * but don't let the pattern expand beyond MAX_BITS.
 * @param patch The patch to grow.
 * @param {string} text Source text.
 * @param opts
 * @private
 */
export function addContext_(patch: Patch, text: string, opts: PatchOptions) {
  if (text.length === 0) {
    return
  }
  let pattern = text.substring(patch.start2, patch.start2 + patch.length1)
  let padding = 0

  // Look for the first and last matches of pattern in text.  If two different
  // matches are found, increase the pattern length.
  while (
    text.indexOf(pattern) !== text.lastIndexOf(pattern) &&
    pattern.length < MAX_BITS - opts.margin - opts.margin
  ) {
    padding += opts.margin
    pattern = text.substring(
      patch.start2 - padding,
      patch.start2 + patch.length1 + padding,
    )
  }
  // Add one chunk for good luck.
  padding += opts.margin

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
