import { cleanupMerge } from './cleanup'
import { Diff, DiffType } from './diff'

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
