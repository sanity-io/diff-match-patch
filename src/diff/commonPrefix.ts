/**
 * Determine the common prefix of two strings.
 *
 * @param text1 - First string.
 * @param text2 - Second string.
 * @returns The number of characters common to the start of each string.
 * @internal
 */
export function getCommonPrefix(text1: string, text2: string): number {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1[0] !== text2[0]) {
    return 0
  }

  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  let pointermin = 0
  let pointermax = Math.min(text1.length, text2.length)
  let pointermid = pointermax
  let pointerstart = 0
  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) == text2.substring(pointerstart, pointermid)) {
      pointermin = pointermid
      pointerstart = pointermin
    } else {
      pointermax = pointermid
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin)
  }
  return pointermid
}
