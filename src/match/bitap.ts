/* tslint:disable:no-bitwise */

interface BitapOptions {
  threshold: number
  distance: number
}

interface Alphabet {
  [char: string]: number
}

const DEFAULT_OPTIONS: BitapOptions = {
  // At what point is no match declared (0.0 = perfection, 1.0 = very loose).
  threshold: 0.5,
  // How far to search for a match (0 = exact location, 1000+ = broad match).
  // A match this many characters away from the expected location will add
  // 1.0 to the score (0.0 is a perfect match).
  distance: 1000,
}

function applyDefaults(options: Partial<BitapOptions>): BitapOptions {
  return { ...DEFAULT_OPTIONS, ...options }
}

// The number of bits in an int.
const MAX_BITS = 32

/**
 * Locate the best instance of 'pattern' in 'text' near 'loc' using the
 * Bitap algorithm.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 * @private
 */
export function bitap_(
  text: string,
  pattern: string,
  loc: number,
  opts: Partial<BitapOptions> = {},
) {
  if (pattern.length > MAX_BITS) {
    throw new Error('Pattern too long for this browser.')
  }

  const options = applyDefaults(opts)

  // Initialise the alphabet.
  const s = alphabet_(pattern)

  /**
   * Compute and return the score for a match with e errors and x location.
   * Accesses loc and pattern through being a closure.
   * @param {number} e Number of errors in match.
   * @param {number} x Location of match.
   * @return {number} Overall score for match (0.0 = good, 1.0 = bad).
   * @private
   */
  function bitapScore_(e: number, x: number) {
    const accuracy = e / pattern.length
    const proximity = Math.abs(loc - x)
    if (!options.distance) {
      // Dodge divide by zero error.
      return proximity ? 1.0 : accuracy
    }
    return accuracy + proximity / options.distance
  }

  // Highest score beyond which we give up.
  let scoreThreshold = options.threshold
  // Is there a nearby exact match? (speedup)
  let bestLoc = text.indexOf(pattern, loc)
  if (bestLoc !== -1) {
    scoreThreshold = Math.min(bitapScore_(0, bestLoc), scoreThreshold)
    // What about in the other direction? (speedup)
    bestLoc = text.lastIndexOf(pattern, loc + pattern.length)
    if (bestLoc !== -1) {
      scoreThreshold = Math.min(bitapScore_(0, bestLoc), scoreThreshold)
    }
  }

  // Initialise the bit arrays.
  const matchmask = 1 << (pattern.length - 1)
  bestLoc = -1

  let binMin
  let binMid
  let binMax = pattern.length + text.length
  let lastRd
  for (let d = 0; d < pattern.length; d++) {
    // Scan for the best match; each iteration allows for one more error.
    // Run a binary search to determine how far from 'loc' we can stray at this
    // error level.
    binMin = 0
    binMid = binMax
    while (binMin < binMid) {
      if (bitapScore_(d, loc + binMid) <= scoreThreshold) {
        binMin = binMid
      } else {
        binMax = binMid
      }
      binMid = Math.floor((binMax - binMin) / 2 + binMin)
    }
    // Use the result from this iteration as the maximum for the next.
    binMax = binMid
    let start = Math.max(1, loc - binMid + 1)
    const finish = Math.min(loc + binMid, text.length) + pattern.length

    const rd = Array(finish + 2)
    rd[finish + 1] = (1 << d) - 1
    for (let j = finish; j >= start; j--) {
      // The alphabet (s) is a sparse hash, so the following line generates
      // warnings.
      const charMatch = s[text.charAt(j - 1)]
      if (d === 0) {
        // First pass: exact match.
        rd[j] = ((rd[j + 1] << 1) | 1) & charMatch
      } else {
        // Subsequent passes: fuzzy match.
        rd[j] =
          (((rd[j + 1] << 1) | 1) & charMatch) |
          (((lastRd[j + 1] | lastRd[j]) << 1) | 1) |
          lastRd[j + 1]
      }
      if (rd[j] & matchmask) {
        const score = bitapScore_(d, j - 1)
        // This match will almost certainly be better than any existing match.
        // But check anyway.
        if (score <= scoreThreshold) {
          // Told you so.
          scoreThreshold = score
          bestLoc = j - 1
          if (bestLoc > loc) {
            // When passing loc, don't exceed our current distance from loc.
            start = Math.max(1, 2 * loc - bestLoc)
          } else {
            // Already passed loc, downhill from here on in.
            break
          }
        }
      }
    }
    // No hope for a (better) match at greater error levels.
    if (bitapScore_(d + 1, loc) > scoreThreshold) {
      break
    }
    lastRd = rd
  }
  return bestLoc
}

/**
 * Initialise the alphabet for the Bitap algorithm.
 * @param {string} pattern The text to encode.
 * @return {!Object} Hash of character locations.
 * @private
 */
export function alphabet_(pattern: string): Alphabet {
  const s: Alphabet = {}
  for (let i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] = 0
  }
  for (let i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1)
  }
  return s
}
