/**
 * Determine the common prefix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
import { isSliceEqual } from '../utils/isSliceEqual'

export function commonPrefix(t1: string, t2: string): number {
  const text1 = [...t1]
  const text2 = [...t2]
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
    if (
      isSliceEqual(
        text1,
        text2,
        pointerstart,
        pointermid,
        pointerstart,
        pointermid,
      )
    ) {
      pointermin = pointermid
      pointerstart = pointermin
    } else {
      pointermax = pointermid
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin)
  }
  return pointermid
}
