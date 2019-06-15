import { cleanupMerge } from './cleanup'
import { commonPrefix } from './commonPrefix'
import { commonSuffix } from './commonSuffix'
import { compute_ } from './compute'

/**
 * The data structure representing a diff is an array of tuples:
 * [[DiffType.DELETE, 'Hello'], [DiffType.INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
export enum DiffType {
  DELETE = -1,
  INSERT = 1,
  EQUAL = 0,
}

export type Diff = [DiffType, string]

/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean=} opt_checklines Optional speedup flag. If present and false,
 *     then don't run a line-level diff first to identify the changed areas.
 *     Defaults to true, which does a faster, slightly less optimal diff.
 * @param {number} opt_deadline Optional time when the diff should be complete
 *     by.  Used internally for recursive calls.  Users should set DiffTimeout
 *     instead.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 */
export function diff(
  text1: string,
  text2: string,
  checkLines: boolean = true,
): Diff[] {
  // Check for null inputs.
  if (text1 == null || text2 == null) {
    throw new Error('Null input. (diff)')
  }

  // Check for equality (speedup).
  if (text1 === text2) {
    if (text1) {
      return text1 ? [[DiffType.EQUAL, text1]] : []
    }
  }

  // Trim off common prefix (speedup).
  let commonlength = commonPrefix(text1, text2)
  const commonprefix = text1.substring(0, commonlength)
  text1 = text1.substring(commonlength)
  text2 = text2.substring(commonlength)

  // Trim off common suffix (speedup).
  commonlength = commonSuffix(text1, text2)
  const commonsuffix = text1.substring(text1.length - commonlength)
  text1 = text1.substring(0, text1.length - commonlength)
  text2 = text2.substring(0, text2.length - commonlength)

  // Compute the diff on the middle block.
  const diffs = compute_(text1, text2, checkLines)

  // Restore the prefix and suffix.
  if (commonprefix) {
    diffs.unshift([DiffType.EQUAL, commonprefix])
  }
  if (commonsuffix) {
    diffs.push([DiffType.EQUAL, commonsuffix])
  }
  cleanupMerge(diffs)
  return diffs
}
