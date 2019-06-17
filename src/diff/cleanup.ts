import { commonOverlap_ } from './commonOverlap'
import { commonPrefix } from './commonPrefix'
import { commonSuffix } from './commonSuffix'
import { Diff, DiffType } from './diff'

/**
 * Reduce the number of edits by eliminating semantically trivial equalities.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
export function _cleanupSemantic(diffs: Diff[]) {
  let changes = false
  const equalities = [] // Stack of indices where equalities are found.
  let equalitiesLength = 0 // Keeping our own length var is faster in JS.
  /** @type {?string} */
  let lastequality = null
  // Always equal to diffs[equalities[equalitiesLength - 1]][1]
  let pointer = 0 // Index of current position.
  // Number of characters that changed prior to the equality.
  let lengthInsertions1 = 0
  let lengthDeletions1 = 0
  // Number of characters that changed after the equality.
  let lengthInsertions2 = 0
  let lengthDeletions2 = 0
  while (pointer < diffs.length) {
    if (diffs[pointer][0] === DiffType.EQUAL) {
      // Equality found.
      equalities[equalitiesLength++] = pointer
      lengthInsertions1 = lengthInsertions2
      lengthDeletions1 = lengthDeletions2
      lengthInsertions2 = 0
      lengthDeletions2 = 0
      lastequality = diffs[pointer][1]
    } else {
      // An insertion or deletion.
      if (diffs[pointer][0] === DiffType.INSERT) {
        lengthInsertions2 += diffs[pointer][1].length
      } else {
        lengthDeletions2 += diffs[pointer][1].length
      }
      // Eliminate an equality that is smaller or equal to the edits on both
      // sides of it.
      if (
        lastequality &&
        lastequality.length <= Math.max(lengthInsertions1, lengthDeletions1) &&
        lastequality.length <= Math.max(lengthInsertions2, lengthDeletions2)
      ) {
        // Duplicate record.
        diffs.splice(equalities[equalitiesLength - 1], 0, [
          DiffType.DELETE,
          lastequality,
        ])
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DiffType.INSERT
        // Throw away the equality we just deleted.
        equalitiesLength--
        // Throw away the previous equality (it needs to be reevaluated).
        equalitiesLength--
        pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1
        lengthInsertions1 = 0 // Reset the counters.
        lengthDeletions1 = 0
        lengthInsertions2 = 0
        lengthDeletions2 = 0
        lastequality = null
        changes = true
      }
    }
    pointer++
  }

  // Normalize the diff.
  if (changes) {
    cleanupMerge(diffs)
  }
  cleanupSemanticLossless(diffs)

  // Find any overlaps between deletions and insertions.
  // e.g: <del>abcxxx</del><ins>xxxdef</ins>
  //   -> <del>abc</del>xxx<ins>def</ins>
  // e.g: <del>xxxabc</del><ins>defxxx</ins>
  //   -> <ins>def</ins>xxx<del>abc</del>
  // Only extract an overlap if it is as big as the edit ahead or behind it.
  pointer = 1
  while (pointer < diffs.length) {
    if (
      diffs[pointer - 1][0] === DiffType.DELETE &&
      diffs[pointer][0] === DiffType.INSERT
    ) {
      const deletion = diffs[pointer - 1][1]
      const insertion = diffs[pointer][1]
      const overlapLength1 = commonOverlap_(deletion, insertion)
      const overlapLength2 = commonOverlap_(insertion, deletion)
      if (overlapLength1 >= overlapLength2) {
        if (
          overlapLength1 >= deletion.length / 2 ||
          overlapLength1 >= insertion.length / 2
        ) {
          // Overlap found.  Insert an equality and trim the surrounding edits.
          diffs.splice(pointer, 0, [
            DiffType.EQUAL,
            insertion.substring(0, overlapLength1),
          ])
          diffs[pointer - 1][1] = deletion.substring(
            0,
            deletion.length - overlapLength1,
          )
          diffs[pointer + 1][1] = insertion.substring(overlapLength1)
          pointer++
        }
      } else {
        if (
          overlapLength2 >= deletion.length / 2 ||
          overlapLength2 >= insertion.length / 2
        ) {
          // Reverse overlap found.
          // Insert an equality and swap and trim the surrounding edits.
          diffs.splice(pointer, 0, [
            DiffType.EQUAL,
            deletion.substring(0, overlapLength2),
          ])
          diffs[pointer - 1][0] = DiffType.INSERT
          diffs[pointer - 1][1] = insertion.substring(
            0,
            insertion.length - overlapLength2,
          )
          diffs[pointer + 1][0] = DiffType.DELETE
          diffs[pointer + 1][1] = deletion.substring(overlapLength2)
          pointer++
        }
      }
      pointer++
    }
    pointer++
  }
}

// Define some regex patterns for matching boundaries.
const nonAlphaNumericRegex = /[^a-zA-Z0-9]/
const whitespaceRegex = /\s/
const linebreakRegex = /[\r\n]/
const blanklineEndRegex = /\n\r?\n$/
const blanklineStartRegex = /^\r?\n\r?\n/

/**
 * Look for single edits surrounded on both sides by equalities
 * which can be shifted sideways to align the edit to a word boundary.
 * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
export function cleanupSemanticLossless(diffs: Diff[]) {
  /**
   * Given two strings, compute a score representing whether the internal
   * boundary falls on logical boundaries.
   * Scores range from 6 (best) to 0 (worst).
   * Closure, but does not reference any external variables.
   * @param {string} one First string.
   * @param {string} two Second string.
   * @return {number} The score.
   * @private
   */
  function diff_cleanupSemanticScore_(one: string, two: string) {
    if (!one || !two) {
      // Edges are the best.
      return 6
    }

    // Each port of this function behaves slightly differently due to
    // subtle differences in each language's definition of things like
    // 'whitespace'.  Since this function's purpose is largely cosmetic,
    // the choice has been made to use each language's native features
    // rather than force total conformity.
    const char1 = one.charAt(one.length - 1)
    const char2 = two.charAt(0)
    const nonAlphaNumeric1 = char1.match(nonAlphaNumericRegex)
    const nonAlphaNumeric2 = char2.match(nonAlphaNumericRegex)
    const whitespace1 = nonAlphaNumeric1 && char1.match(whitespaceRegex)
    const whitespace2 = nonAlphaNumeric2 && char2.match(whitespaceRegex)
    const lineBreak1 = whitespace1 && char1.match(linebreakRegex)
    const lineBreak2 = whitespace2 && char2.match(linebreakRegex)
    const blankLine1 = lineBreak1 && one.match(blanklineEndRegex)
    const blankLine2 = lineBreak2 && two.match(blanklineStartRegex)

    if (blankLine1 || blankLine2) {
      // Five points for blank lines.
      return 5
    } else if (lineBreak1 || lineBreak2) {
      // Four points for line breaks.
      return 4
    } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
      // Three points for end of sentences.
      return 3
    } else if (whitespace1 || whitespace2) {
      // Two points for whitespace.
      return 2
    } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
      // One point for non-alphanumeric.
      return 1
    }
    return 0
  }

  let pointer = 1
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (
      diffs[pointer - 1][0] === DiffType.EQUAL &&
      diffs[pointer + 1][0] === DiffType.EQUAL
    ) {
      // This is a single edit surrounded by equalities.
      let equality1 = diffs[pointer - 1][1]
      let edit = diffs[pointer][1]
      let equality2 = diffs[pointer + 1][1]

      // First, shift the edit as far left as possible.
      const commonOffset = commonSuffix(equality1, edit)
      if (commonOffset) {
        const commonString = edit.substring(edit.length - commonOffset)
        equality1 = equality1.substring(0, equality1.length - commonOffset)
        edit = commonString + edit.substring(0, edit.length - commonOffset)
        equality2 = commonString + equality2
      }

      // Second, step character by character right, looking for the best fit.
      let bestEquality1 = equality1
      let bestEdit = edit
      let bestEquality2 = equality2
      let bestScore =
        diff_cleanupSemanticScore_(equality1, edit) +
        diff_cleanupSemanticScore_(edit, equality2)
      while (edit.charAt(0) === equality2.charAt(0)) {
        equality1 += edit.charAt(0)
        edit = edit.substring(1) + equality2.charAt(0)
        equality2 = equality2.substring(1)
        const score =
          diff_cleanupSemanticScore_(equality1, edit) +
          diff_cleanupSemanticScore_(edit, equality2)
        // The >= encourages trailing rather than leading whitespace on edits.
        if (score >= bestScore) {
          bestScore = score
          bestEquality1 = equality1
          bestEdit = edit
          bestEquality2 = equality2
        }
      }

      if (diffs[pointer - 1][1] !== bestEquality1) {
        // We have an improvement, save it back to the diff.
        if (bestEquality1) {
          diffs[pointer - 1][1] = bestEquality1
        } else {
          diffs.splice(pointer - 1, 1)
          pointer--
        }
        diffs[pointer][1] = bestEdit
        if (bestEquality2) {
          diffs[pointer + 1][1] = bestEquality2
        } else {
          diffs.splice(pointer + 1, 1)
          pointer--
        }
      }
    }
    pointer++
  }
}

/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
export function cleanupMerge(diffs: Diff[]) {
  diffs.push([DiffType.EQUAL, '']) // Add a dummy entry at the end.
  let pointer = 0
  let countDelete = 0
  let countInsert = 0
  let textDelete = ''
  let textInsert = ''
  let commonlength
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DiffType.INSERT:
        countInsert++
        textInsert += diffs[pointer][1]
        pointer++
        break
      case DiffType.DELETE:
        countDelete++
        textDelete += diffs[pointer][1]
        pointer++
        break
      case DiffType.EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (countDelete + countInsert > 1) {
          if (countDelete !== 0 && countInsert !== 0) {
            // Factor out any common prefixies.
            commonlength = commonPrefix(textInsert, textDelete)
            if (commonlength !== 0) {
              if (
                pointer - countDelete - countInsert > 0 &&
                diffs[pointer - countDelete - countInsert - 1][0] ===
                DiffType.EQUAL
              ) {
                diffs[
                pointer - countDelete - countInsert - 1
                  ][1] += textInsert.substring(0, commonlength)
              } else {
                diffs.splice(0, 0, [
                  DiffType.EQUAL,
                  textInsert.substring(0, commonlength),
                ])
                pointer++
              }
              textInsert = textInsert.substring(commonlength)
              textDelete = textDelete.substring(commonlength)
            }
            // Factor out any common suffixies.
            commonlength = commonSuffix(textInsert, textDelete)
            if (commonlength !== 0) {
              diffs[pointer][1] =
                textInsert.substring(textInsert.length - commonlength) +
                diffs[pointer][1]
              textInsert = textInsert.substring(
                0,
                textInsert.length - commonlength,
              )
              textDelete = textDelete.substring(
                0,
                textDelete.length - commonlength,
              )
            }
          }
          // Delete the offending records and add the merged ones.
          if (countDelete === 0) {
            diffs.splice(pointer - countInsert, countDelete + countInsert, [
              DiffType.INSERT,
              textInsert,
            ])
          } else if (countInsert === 0) {
            diffs.splice(pointer - countDelete, countDelete + countInsert, [
              DiffType.DELETE,
              textDelete,
            ])
          } else {
            diffs.splice(
              pointer - countDelete - countInsert,
              countDelete + countInsert,
              [DiffType.DELETE, textDelete],
              [DiffType.INSERT, textInsert],
            )
          }
          pointer =
            pointer -
            countDelete -
            countInsert +
            (countDelete ? 1 : 0) +
            (countInsert ? 1 : 0) +
            1
        } else if (pointer !== 0 && diffs[pointer - 1][0] === DiffType.EQUAL) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1]
          diffs.splice(pointer, 1)
        } else {
          pointer++
        }
        countInsert = 0
        countDelete = 0
        textDelete = ''
        textInsert = ''
        break
    }
  }
  if (diffs[diffs.length - 1][1] === '') {
    diffs.pop() // Remove the dummy entry at the end.
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  let changes = false
  pointer = 1
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (
      diffs[pointer - 1][0] === DiffType.EQUAL &&
      diffs[pointer + 1][0] === DiffType.EQUAL
    ) {
      // This is a single edit surrounded by equalities.
      if (
        diffs[pointer][1].substring(
          diffs[pointer][1].length - diffs[pointer - 1][1].length,
        ) === diffs[pointer - 1][1]
      ) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] =
          diffs[pointer - 1][1] +
          diffs[pointer][1].substring(
            0,
            diffs[pointer][1].length - diffs[pointer - 1][1].length,
          )
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1]
        diffs.splice(pointer - 1, 1)
        changes = true
      } else if (
        diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ===
        diffs[pointer + 1][1]
      ) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1]
        diffs[pointer][1] =
          diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
          diffs[pointer + 1][1]
        diffs.splice(pointer + 1, 1)
        changes = true
      }
    }
    pointer++
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    cleanupMerge(diffs)
  }
}

function trueCount(...args: boolean[]) {
  return args.reduce((n, bool) => n + (bool ? 1 : 0), 0)
}

/**
 * Reduce the number of edits by eliminating operationally trivial equalities.
 */
export function cleanupEfficiency(diffs: Diff[], editCost: number = 4): void {
  let changes = false
  const equalities = [] // Stack of indices where equalities are found.
  let equalitiesLength = 0 // Keeping our own length var is faster in JS.
  /** @type {?string} */
  let lastequality = null
  // Always equal to diffs[equalities[equalitiesLength - 1]][1]
  let pointer = 0 // Index of current position.
  // Is there an insertion operation before the last equality.
  let preIns = false
  // Is there a deletion operation before the last equality.
  let preDel = false
  // Is there an insertion operation after the last equality.
  let postIns = false
  // Is there a deletion operation after the last equality.
  let postDel = false
  while (pointer < diffs.length) {
    if (diffs[pointer][0] === DiffType.EQUAL) {
      // Equality found.
      if (diffs[pointer][1].length < editCost && (postIns || postDel)) {
        // Candidate found.
        equalities[equalitiesLength++] = pointer
        preIns = postIns
        preDel = postDel
        lastequality = diffs[pointer][1]
      } else {
        // Not a candidate, and can never become one.
        equalitiesLength = 0
        lastequality = null
      }
      postIns = postDel = false
    } else {
      // An insertion or deletion.
      if (diffs[pointer][0] === DiffType.DELETE) {
        postDel = true
      } else {
        postIns = true
      }
      /*
       * Five types to be split:
       * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
       * <ins>A</ins>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<ins>C</ins>
       * <ins>A</del>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<del>C</del>
       */
      if (
        lastequality &&
        ((preIns && preDel && postIns && postDel) ||
          (lastequality.length < editCost / 2 &&
            trueCount(preIns, preDel, postIns, postDel) === 3))
      ) {
        // Duplicate record.
        diffs.splice(equalities[equalitiesLength - 1], 0, [
          DiffType.DELETE,
          lastequality,
        ])
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DiffType.INSERT
        equalitiesLength-- // Throw away the equality we just deleted;
        lastequality = null
        if (preIns && preDel) {
          // No changes made which could affect previous entry, keep going.
          postIns = postDel = true
          equalitiesLength = 0
        } else {
          equalitiesLength-- // Throw away the previous equality.
          pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1
          postIns = postDel = false
        }
        changes = true
      }
    }
    pointer++
  }

  if (changes) {
    cleanupMerge(diffs)
  }
}
