/**
 * Determine the common suffix of two strings.
 *
 * @param text1 - First string.
 * @param text2 - Second string.
 * @returns The number of characters common to the end of each string.
 * @internal
 */
export function commonSuffix(text1: string, text2: string): number {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1[text1.length - 1] !== text2[text2.length - 1]) {
    return 0
  }

  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  let pointermin = 0
  let pointermax = Math.min(text1.length, text2.length)
  let pointermid = pointermax
  let pointerend = 0
  while (pointermin < pointermid) {
    if (
      text1.substring(text1.length - pointermid, text1.length - pointerend) ===
      text2.substring(text2.length - pointermid, text2.length - pointerend)
    ) {
      pointermin = pointermid
      pointerend = pointermin
    } else {
      pointermax = pointermid
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin)
  }

  return pointermid
}
