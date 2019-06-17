import { Diff } from './diff'

/**
 * Rehydrate the text in a diff from a string of line hashes to real lines of
 * text.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {!Array.<string>} lineArray Array of unique strings.
 * @private
 */
export function charsToLines_(diffs: Diff[], lineArray: string[]): void {
  // tslint:disable-next-line:prefer-for-of
  for (let x = 0; x < diffs.length; x++) {
    const chars = diffs[x][1]
    const text = []
    for (let y = 0; y < chars.length; y++) {
      text[y] = lineArray[chars.charCodeAt(y)]
    }
    diffs[x][1] = text.join('')
  }
}
