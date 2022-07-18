import { isHighSurrogate, isLowSurrogate } from '../utils/surrogatePairs'
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

function combineChar(data: string, char: string, dir: 1 | -1) {
  if (dir === 1) {
    return data + char
  } else {
    return char + data
  }
}

/**
 * Splits out a character in a given direction.
 */
function splitChar(data: string, dir: 1 | -1): [string, string] {
  if (dir === 1) {
    return [data.substring(0, data.length - 1), data[data.length - 1]]
  } else {
    return [data.substring(1), data[0]]
  }
}

/**
 * Checks if two entries of the diff has the same character in the same "direction".
 */
function hasSharedChar(
  diffs: Diff[],
  i: number,
  j: number,
  dir: 1 | -1,
): boolean {
  if (dir === 1) {
    return (
      diffs[i][1][diffs[i][1].length - 1] ===
      diffs[j][1][diffs[j][1].length - 1]
    )
  } else {
    return diffs[i][1][0] === diffs[j][1][0]
  }
}

/**
 * Takes in a position of an EQUAL diff-type and attempts to "deisolate" the character for a given direction.
 * By this we mean that we attempt to either "shift" it to the later diffs, or bring another character next into this one.
 *
 * It's easier to understand with an example:
 *   [INSERT a, DELETE b, EQUAL cde, INSERT f, DELETE g]
 * shifting this forward will produce
 *   [INSERT a, DELETE b, EQUAL cd, INSERT ef, DELETE eg]
 *
 * This behavior is useful when `e` is actually a high surrogate character.
 *
 * Shifting it backwards produces
 *   [INSERT ac, DELETE bc, EQUAL cde, INSERT f, DELETE g]
 * which is useful when `c` is a low surrogate character.
 *
 * Note that these diffs are 100% semantically equal.
 *
 * If there's not a matching INSERT/DELETE then it's forced to insert an additional entry:
 *   [EQUAL abc, INSERT d, EQUAL e]
 * shifted forward becomes:
 *   [EQUAL ab, INSERT cd, DELETE c, EQUAL e]
 *
 * If the INSERT and DELETE ends with the same character it will instead deisolate it by
 * bring that charcter into _this_ equal:
 *   [EQUAL abc, INSERT de, DELETE df]
 * shifted forward actually becomes
 *   [EQUAL abcd, INSERT e, DELETE f]
 *
 * The original diff here is typically never produced by the diff algorithm directly,
 * but they occur when we isolate characters in other places.
 */
function deisolateChar(diffs: Diff[], i: number, dir: 1 | -1) {
  const inv = dir === 1 ? -1 : 1
  let insertIdx: null | number = null
  let deleteIdx: null | number = null

  let j = i + dir
  loop: for (
    ;
    j >= 0 && j < diffs.length && (insertIdx === null || deleteIdx === null);
    j += dir
  ) {
    const nextDiff = diffs[j]
    if (nextDiff[1].length === 0) continue

    switch (nextDiff[0]) {
      case DiffType.INSERT:
        if (insertIdx === null) {
          insertIdx = j
        }
        break
      case DiffType.DELETE:
        if (deleteIdx === null) {
          deleteIdx = j
        }
        break
      case DiffType.EQUAL:
        if (insertIdx === null && deleteIdx === null) {
          // This means that there was two consecutive EQUAL. Kinda weird, but easy to handle.
          const [text, char] = splitChar(diffs[i][1], dir)
          diffs[i][1] = text
          diffs[j][1] = combineChar(diffs[j][1], char, inv)
          return
        }
        break loop
    }
  }

  if (
    insertIdx !== null &&
    deleteIdx !== null &&
    hasSharedChar(diffs, insertIdx, deleteIdx, dir)
  ) {
    // Special case.
    const [insertText, insertChar] = splitChar(diffs[insertIdx][1], inv)
    const [deleteText, _] = splitChar(diffs[deleteIdx][1], inv)
    diffs[insertIdx][1] = insertText
    diffs[deleteIdx][1] = deleteText
    diffs[i][1] = combineChar(diffs[i][1], insertChar, dir)
    return
  }

  const [text, char] = splitChar(diffs[i][1], dir)
  diffs[i][1] = text

  if (insertIdx === null) {
    diffs.splice(j, 0, [DiffType.INSERT, char])

    // We need to adjust deleteIdx here since it's been shifted
    if (deleteIdx !== null && deleteIdx >= j) deleteIdx++
  } else {
    diffs[insertIdx][1] = combineChar(diffs[insertIdx][1], char, inv)
  }

  if (deleteIdx === null) {
    diffs.splice(j, 0, [DiffType.DELETE, char])
  } else {
    diffs[deleteIdx][1] = combineChar(diffs[deleteIdx][1], char, inv)
  }
}

function adjustDiffForSurrogatePairs(diffs: Diff[]) {
  // Go over each pair of diffs and see if there was a split at a surrogate pair
  for (let i = 0; i < diffs.length; i++) {
    let [diffType, diffText] = diffs[i]

    if (diffText.length === 0) continue

    const firstChar = diffText[0]
    const lastChar = diffText[diffText.length - 1]

    if (isHighSurrogate(lastChar) && diffType === DiffType.EQUAL) {
      deisolateChar(diffs, i, 1)
    }

    if (isLowSurrogate(firstChar) && diffType === DiffType.EQUAL) {
      deisolateChar(diffs, i, -1)
    }
  }

  for (let i = 0; i < diffs.length; i++) {
    // Remove any empty diffs
    if (diffs[i][1].length === 0) {
      diffs.splice(i, 1)
    }
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

  const diffs = _diff(text1, text2, createInternalOpts(opts || {}))
  adjustDiffForSurrogatePairs(diffs)
  return diffs
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
