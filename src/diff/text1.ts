/**
 * Compute and return the source text (all equalities and deletions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Source text.
 */
import { DiffType } from './diff'

export function diff_text1(diffs) {
  const text = []
  for (let x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DiffType.INSERT) {
      text[x] = diffs[x][1]
    }
  }
  return text.join('')
}
