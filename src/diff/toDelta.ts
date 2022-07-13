import { Diff, DiffType } from './diff'

/**
 * Crush the diff into an encoded string which describes the operations
 * required to transform text1 into text2.
 * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
 * Operations are tab-separated.  Inserted text is escaped using %xx notation.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Delta text.
 */
export function toDelta(diffs: Diff[]): string {
  const text = []
  for (let x = 0; x < diffs.length; x++) {
    switch (diffs[x][0]) {
      case DiffType.INSERT:
        text[x] = '+' + encodeURI(diffs[x][1])
        break
      case DiffType.DELETE:
        text[x] = '-' + diffs[x][1].length
        break
      case DiffType.EQUAL:
        text[x] = '=' + diffs[x][1].length
        break
    }
  }
  return text.join('\t').replace(/%20/g, ' ')
}
