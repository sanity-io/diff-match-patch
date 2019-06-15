/**
 * Given the original text1, and an encoded string which describes the
 * operations required to transform text1 into text2, compute the full diff.
 * @param {string} text1 Source string for the diff.
 * @param {string} delta Delta text.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @throws {!Error} If invalid input.
 */
import { DiffType } from './diff'

function fromDelta(text1: string, delta: string) {
  const diffs = []
  let diffsLength = 0 // Keeping our own length var is faster in JS.
  let pointer = 0 // Cursor in text1
  const tokens = delta.split(/\t/g)
  // tslint:disable-next-line:prefer-for-of
  for (let x = 0; x < tokens.length; x++) {
    // Each token begins with a one character parameter which specifies the
    // operation of this token (delete, insert, equality).
    const param = tokens[x].substring(1)
    switch (tokens[x].charAt(0)) {
      case '+':
        try {
          diffs[diffsLength++] = [DiffType.INSERT, decodeURI(param)]
        } catch (ex) {
          // Malformed URI sequence.
          throw new Error('Illegal escape in diff_fromDelta: ' + param)
        }
        break
      case '-':
      // Fall through.
      case '=':
        const n = parseInt(param, 10)
        if (isNaN(n) || n < 0) {
          throw new Error('Invalid number in diff_fromDelta: ' + param)
        }
        const text = text1.substring(pointer, (pointer += n))
        if (tokens[x].charAt(0) === '=') {
          diffs[diffsLength++] = [DiffType.EQUAL, text]
        } else {
          diffs[diffsLength++] = [DiffType.DELETE, text]
        }
        break
      default:
        // Blank tokens are ok (from a trailing \t).
        // Anything else is an error.
        if (tokens[x]) {
          throw new Error(
            'Invalid diff operation in diff_fromDelta: ' + tokens[x],
          )
        }
    }
  }
  if (pointer !== text1.length) {
    throw new Error(
      'Delta length (' +
        pointer +
        ') does not equal source text length (' +
        text1.length +
        ').',
    )
  }
  return diffs
}
