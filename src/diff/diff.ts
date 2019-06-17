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

export interface DiffOptions {
  checkLines: boolean
  timeout: number
}
export interface InternalDiffOptions {
  checkLines: boolean
  deadline: number
}

function createDeadLine(timeout: undefined | number): number {
  const t =
    typeof timeout === 'undefined'
      ? 1
      : timeout <= 0
      ? Number.MAX_VALUE
      : timeout
  return Date.now() + t * 1000
}
function createInternalOpts(opts: Partial<DiffOptions>): InternalDiffOptions {
  return {
    checkLines: true,
    deadline: createDeadLine(opts.timeout || 1.0),
    ...opts,
  }
}
export function diff(
  text1: null | string,
  text2: null | string,
  opts?: Partial<DiffOptions>,
) {
  // Check for null inputs.
  if (text1 === null || text2 === null) {
    throw new Error('Null input. (diff)')
  }

  return _diff(text1, text2, createInternalOpts(opts || {}))
}
/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 */
export function _diff(
  text1: string,
  text2: string,
  options: InternalDiffOptions,
): Diff[] {
  // Check for equality (speedup).
  if (text1 === text2) {
    return text1 ? [[DiffType.EQUAL, text1]] : []
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
  const diffs = compute_(text1, text2, options)

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
