import { Diff, DiffType } from './diff.js'

/**
 * Compute and return the source text (all equalities and deletions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Source text.
 */
export function diffText1(diffs: Diff[]) {
  const text = []
  for (let x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DiffType.INSERT) {
      text[x] = diffs[x][1]
    }
  }
  return text.join('')
}

/**
 * Compute and return the destination text (all equalities and insertions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Destination text.
 */
export function diffText2(diffs: Diff[]): string {
  const text = []
  for (let x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DiffType.DELETE) {
      text[x] = diffs[x][1]
    }
  }
  return text.join('')
}
