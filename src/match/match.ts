//  MATCH FUNCTIONS
import { bitap_ } from './bitap.js'

/**
 * Locate the best instance of 'pattern' in 'text' near 'loc'.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 */
export function match(text: string, pattern: string, loc: number): number {
  // Check for null inputs.
  if (text === null || pattern === null || loc === null) {
    throw new Error('Null input. (match())')
  }

  loc = Math.max(0, Math.min(loc, text.length))
  if (text === pattern) {
    // Shortcut (potentially not guaranteed by the algorithm)
    return 0
  } else if (!text.length) {
    // Nothing to match.
    return -1
  } else if (text.substring(loc, loc + pattern.length) === pattern) {
    // Perfect match at the perfect spot!  (Includes case of null pattern)
    return loc
  } else {
    // Do a fuzzy compare.
    return bitap_(text, pattern, loc)
  }
}
