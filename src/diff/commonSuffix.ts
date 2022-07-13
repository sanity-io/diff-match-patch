import { isSliceEqual } from '../utils/isSliceEqual'

/**
 * Determine the common suffix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
export function commonSuffix(t1: string, t2: string): number {
  const text1 = [...t1]
  const text2 = [...t2]
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
      isSliceEqual(
        text1,
        text2,
        text1.length - pointermid,
        text1.length - pointerend,
        text2.length - pointermid,
        text2.length - pointerend,
      )
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
