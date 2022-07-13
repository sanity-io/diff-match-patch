import { cleanupSemanticLossless } from '../diff/cleanup'
import { diff, DiffType } from '../diff/diff'
import { diffText1, diffText2 } from '../diff/diffText'
import { levenshtein } from '../diff/levenshtein'
import { xIndex } from '../diff/xIndex'
import { match } from '../match/match'
import { DEFAULT_MARGIN, MAX_BITS } from './constants'
import { deepCopy, Patch } from './createPatchObject'
import { splitMax } from './splitMax'

// When deleting a large block of text (over ~64 characters), how close do
// the contents have to be to match the expected contents. (0.0 = perfection,
// 1.0 = very loose).  Note that Match_Threshold controls how closely the
// end points of a delete need to match.
interface PatchOptions {
  // Chunk size for context length.
  margin: number
  deleteThreshold: number
}

const DEFAULT_OPTS = {
  margin: DEFAULT_MARGIN,
  deleteThreshold: 0.4,
}

function getDefaultOpts(opts: Partial<PatchOptions> = {}): PatchOptions {
  return {
    ...DEFAULT_OPTS,
    ...opts,
  }
}

/**
 * Merge a set of patches onto the text.  Return a patched text, as well
 * as a list of true/false values indicating which patches were applied.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @param {string} text Old text.
 * @return {!Array.<string|!Array.<boolean>>} Two element Array, containing the
 *      new text and an array of boolean values.
 */
type PatchResult = [string, boolean[]]

export function apply(
  patches: Patch[],
  text: string,
  opts: Partial<PatchOptions> = {},
): PatchResult {
  if (patches.length === 0) {
    return [text, []]
  }

  const options = getDefaultOpts(opts)
  // Deep copy the patches so that no changes are made to originals.
  patches = deepCopy(patches)

  const nullPadding = addPadding(patches, options.margin)
  text = nullPadding + text + nullPadding

  splitMax(patches, options.margin)
  // delta keeps track of the offset between the expected and actual location
  // of the previous patch.  If there are patches expected at positions 10 and
  // 20, but the first patch was found at 12, delta is 2 and the second patch
  // has an effective expected position of 22.
  let delta = 0
  const results = []
  for (let x = 0; x < patches.length; x++) {
    const expectedLoc = patches[x].start2 + delta
    const text1 = diffText1(patches[x].diffs)
    let startLoc
    let endLoc = -1
    if (text1.length > MAX_BITS) {
      // patch_splitMax will only provide an oversized pattern in the case of
      // a monster delete.
      startLoc = match(text, text1.substring(0, MAX_BITS), expectedLoc)
      if (startLoc !== -1) {
        endLoc = match(
          text,
          text1.substring(text1.length - MAX_BITS),
          expectedLoc + text1.length - MAX_BITS,
        )
        if (endLoc === -1 || startLoc >= endLoc) {
          // Can't find valid trailing context.  Drop this patch.
          startLoc = -1
        }
      }
    } else {
      startLoc = match(text, text1, expectedLoc)
    }
    if (startLoc === -1) {
      // No match found.  :(
      results[x] = false
      // Subtract the delta for this failed patch from subsequent patches.
      delta -= patches[x].length2 - patches[x].length1
    } else {
      // Found a match.  :)
      results[x] = true
      delta = startLoc - expectedLoc
      let text2
      // tslint:disable-next-line:prefer-conditional-expression
      if (endLoc === -1) {
        text2 = text.substring(startLoc, startLoc + text1.length)
      } else {
        text2 = text.substring(startLoc, endLoc + MAX_BITS)
      }
      if (text1 === text2) {
        // Perfect match, just shove the replacement text in.
        text =
          text.substring(0, startLoc) +
          diffText2(patches[x].diffs) +
          text.substring(startLoc + text1.length)
      } else {
        // Imperfect match.  Run a diff to get a framework of equivalent
        // indices.
        const diffs = diff(text1, text2, { checkLines: false })
        if (
          text1.length > MAX_BITS &&
          levenshtein(diffs) / text1.length > options.deleteThreshold
        ) {
          // The end points match, but the content is unacceptably bad.
          results[x] = false
        } else {
          cleanupSemanticLossless(diffs)
          let index1 = 0
          let index2 = 0
          // tslint:disable-next-line:prefer-for-of
          for (let y = 0; y < patches[x].diffs.length; y++) {
            const mod = patches[x].diffs[y]
            if (mod[0] !== DiffType.EQUAL) {
              index2 = xIndex(diffs, index1)
            }
            if (mod[0] === DiffType.INSERT) {
              // Insertion
              text =
                text.substring(0, startLoc + index2) +
                mod[1] +
                text.substring(startLoc + index2)
            } else if (mod[0] === DiffType.DELETE) {
              // Deletion
              text =
                text.substring(0, startLoc + index2) +
                text.substring(startLoc + xIndex(diffs, index1 + mod[1].length))
            }
            if (mod[0] !== DiffType.DELETE) {
              index1 += mod[1].length
            }
          }
        }
      }
    }
  }
  // Strip the padding off.
  text = text.substring(nullPadding.length, text.length - nullPadding.length)
  return [text, results]
}

/**
 * Add some padding on text start and end so that edges can match something.
 * Intended to be called only from within patch_apply.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {string} The padding string added to each side.
 */
export function addPadding(patches: Patch[], margin: number = DEFAULT_MARGIN) {
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
  if (diffs.length === 0 || diffs[0][0] !== DiffType.EQUAL) {
    // Add nullPadding equality.
    diffs.unshift([DiffType.EQUAL, nullPadding])
    patch.start1 -= paddingLength // Should be 0.
    patch.start2 -= paddingLength // Should be 0.
    patch.length1 += paddingLength
    patch.length2 += paddingLength
  } else if (paddingLength > diffs[0][1].length) {
    // Grow first equality.
    const extraLength = paddingLength - diffs[0][1].length
    diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1]
    patch.start1 -= extraLength
    patch.start2 -= extraLength
    patch.length1 += extraLength
    patch.length2 += extraLength
  }

  // Add some padding on end of last diff.
  patch = patches[patches.length - 1]
  diffs = patch.diffs
  if (diffs.length === 0 || diffs[diffs.length - 1][0] !== DiffType.EQUAL) {
    // Add nullPadding equality.
    diffs.push([DiffType.EQUAL, nullPadding])
    patch.length1 += paddingLength
    patch.length2 += paddingLength
  } else if (paddingLength > diffs[diffs.length - 1][1].length) {
    // Grow last equality.
    const extraLength = paddingLength - diffs[diffs.length - 1][1].length
    diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength)
    patch.length1 += extraLength
    patch.length2 += extraLength
  }

  return nullPadding
}
