import { Diff, DiffType } from './diff'

/**
 * Compute the Levenshtein distance; the number of inserted, deleted or
 * substituted characters.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {number} Number of changes.
 */
export function levenshtein(diffs: Diff[]) {
  let leven = 0
  let insertions = 0
  let deletions = 0
  // tslint:disable-next-line:prefer-for-of
  for (let x = 0; x < diffs.length; x++) {
    const op = diffs[x][0]
    const data = diffs[x][1]
    switch (op) {
      case DiffType.INSERT:
        insertions += data.length
        break
      case DiffType.DELETE:
        deletions += data.length
        break
      case DiffType.EQUAL:
        // A deletion and an insertion is one substitution.
        leven += Math.max(insertions, deletions)
        insertions = 0
        deletions = 0
        break
    }
  }
  leven += Math.max(insertions, deletions)
  return leven
}
