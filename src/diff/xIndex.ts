/**
 * loc is a location in text1, compute and return the equivalent location in
 * text2.
 * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {number} loc Location within text1.
 * @return {number} Location within text2.
 */
import { DiffType } from './diff'

export function xIndex(diffs, loc) {
  let chars1 = 0
  let chars2 = 0
  let lastChars1 = 0
  let lastChars2 = 0
  let x
  for (x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DiffType.INSERT) {
      // Equality or deletion.
      chars1 += diffs[x][1].length
    }
    if (diffs[x][0] !== DiffType.DELETE) {
      // Equality or insertion.
      chars2 += diffs[x][1].length
    }
    if (chars1 > loc) {
      // Overshot the location.
      break
    }
    lastChars1 = chars1
    lastChars2 = chars2
  }
  // Was the location was deleted?
  if (diffs.length !== x && diffs[x][0] === DiffType.DELETE) {
    return lastChars2
  }
  // Add the remaining character length.
  return lastChars2 + (loc - lastChars1)
}
