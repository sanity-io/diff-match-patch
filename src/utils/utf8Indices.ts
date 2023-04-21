import type { Patch } from '../index.js'

/**
 * Takes a `patches` array as produced by diff-match-patch and adjusts the
 * `start1` and `start2` properties so that they refer to UTF-8 index instead
 * of a UCS-2 index.
 */
export function adjustIndiciesToUtf8(patches: Patch[], base: string): Patch[] {
  let byteOffset = 0
  let idx = 0 // index into the input.

  function advanceTo(target: number) {
    for (; idx < target; idx++) {
      const codePoint = base.codePointAt(idx)
      if (typeof codePoint === 'undefined') {
        throw new Error('Failed to get codepoint')
      }

      byteOffset += utf8len(codePoint)

      // This is encoded as a surrogate pair.
      if (codePoint > 0xffff) {
        idx++
      }
    }

    if (idx !== target) {
      throw new Error('Failed to determine byte offset')
    }

    return byteOffset
  }

  const adjusted: Patch[] = []
  for (const patch of patches) {
    adjusted.push({
      diffs: patch.diffs,
      start1: advanceTo(patch.start1),
      start2: advanceTo(patch.start2),
      length1: patch.length1,
      length2: patch.length2,
    })
  }

  return adjusted
}

/**
 * Takes a `patches` array as produced by diff-match-patch and adjusts the
 * `start1` and `start2` properties so that they refer to UCS-2 index instead
 * of a UTF-8 index.
 */
export function adjustIndiciesToUcs2(patches: Patch[], base: string): Patch[] {
  let byteOffset = 0
  let idx = 0 // index into the input.

  function advanceTo(target: number) {
    for (; byteOffset < target; ) {
      const codePoint = base.codePointAt(idx)
      if (typeof codePoint === 'undefined') {
        throw new Error('Failed to get codepoint')
      }

      byteOffset += utf8len(codePoint)

      // This is encoded as a surrogate pair.
      if (codePoint > 0xffff) {
        idx += 2
      } else {
        idx += 1
      }
    }

    if (byteOffset !== target) {
      throw new Error('Failed to determine byte offset')
    }

    return idx
  }

  const adjusted: Patch[] = []
  for (const patch of patches) {
    adjusted.push({
      diffs: patch.diffs,
      start1: advanceTo(patch.start1),
      start2: advanceTo(patch.start2),
      length1: patch.length1,
      length2: patch.length2,
    })
  }

  return adjusted
}

function utf8len(codePoint: number): 1 | 2 | 3 | 4 {
  // See table at https://en.wikipedia.org/wiki/UTF-8
  if (codePoint <= 0x007f) return 1
  if (codePoint <= 0x07ff) return 2
  if (codePoint <= 0xffff) return 3
  return 4
}
