import {bitap} from './bitap.js'

/**
 * Locate the best instance of 'pattern' in 'text' near 'loc'.
 *
 * @param text - The text to search.
 * @param pattern - The pattern to search for.
 * @param searchLocation - The location to search around.
 * @returns Best match index or -1.
 * @public
 */
export function match(text: string, pattern: string, searchLocation: number): number {
  // Check for null inputs.
  if (text === null || pattern === null || searchLocation === null) {
    throw new Error('Null input. (match())')
  }

  const loc = Math.max(0, Math.min(searchLocation, text.length))
  if (text === pattern) {
    // Shortcut (potentially not guaranteed by the algorithm)
    return 0
  } else if (!text.length) {
    // Nothing to match.
    return -1
  } else if (text.substring(loc, loc + pattern.length) === pattern) {
    // Perfect match at the perfect spot!  (Includes case of null pattern)
    return loc
  }

  // Do a fuzzy compare.
  return bitap(text, pattern, loc)
}
