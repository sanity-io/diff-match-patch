import { commonPrefix } from './commonPrefix'
import { commonSuffix } from './commonSuffix'

type HalfMatch = [string, string, string, string, string]

/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 * @private
 */
function halfMatchI_(
  longtext: string,
  shorttext: string,
  i: number,
): null | HalfMatch {
  // Start with a 1/4 length substring at position i as a seed.
  const seed = longtext.substring(i, i + Math.floor(longtext.length / 4))
  let j = -1
  let bestCommon = ''
  let bestLongtextA
  let bestLongtextB
  let bestShorttextA
  let bestShorttextB
  // tslint:disable-next-line:no-conditional-assignment
  while ((j = shorttext.indexOf(seed, j + 1)) !== -1) {
    const prefixLength = commonPrefix(
      longtext.substring(i),
      shorttext.substring(j),
    )
    const suffixLength = commonSuffix(
      longtext.substring(0, i),
      shorttext.substring(0, j),
    )
    if (bestCommon.length < suffixLength + prefixLength) {
      bestCommon =
        shorttext.substring(j - suffixLength, j) +
        shorttext.substring(j, j + prefixLength)
      bestLongtextA = longtext.substring(0, i - suffixLength)
      bestLongtextB = longtext.substring(i + prefixLength)
      bestShorttextA = shorttext.substring(0, j - suffixLength)
      bestShorttextB = shorttext.substring(j + prefixLength)
    }
  }
  if (bestCommon.length * 2 >= longtext.length) {
    return [
      bestLongtextA || '',
      bestLongtextB || '',
      bestShorttextA || '',
      bestShorttextB || '',
      bestCommon || '',
    ]
  } else {
    return null
  }
}
export function halfMatch_(
  text1: string,
  text2: string,
  timeout = 1,
): null | HalfMatch {
  if (timeout <= 0) {
    // Don't risk returning a non-optimal diff if we have unlimited time.
    return null
  }

  const longtext = text1.length > text2.length ? text1 : text2
  const shorttext = text1.length > text2.length ? text2 : text1
  if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
    return null // Pointless.
  }

  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext.
   * @return {Array.<string>} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */

  // First check if the second quarter is the seed for a half-match.
  const hm1 = halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 4))
  // Check again based on the third quarter.
  const hm2 = halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 2))
  let hm
  if (!hm1 && !hm2) {
    return null
  } else if (!hm2) {
    hm = hm1
  } else if (!hm1) {
    hm = hm2
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2
  }

  // A half-match was found, sort out the return data.
  let text1A: string
  let text1B: string
  let text2A: string
  let text2B: string
  if (hm) {
    if (text1.length > text2.length) {
      text1A = hm[0]
      text1B = hm[1]
      text2A = hm[2]
      text2B = hm[3]
    } else {
      text2A = hm[0]
      text2B = hm[1]
      text1A = hm[2]
      text1B = hm[3]
    }
    const midCommon = hm[4]
    return [text1A, text1B, text2A, text2B, midCommon]
  }
  throw new Error('nope')
}
