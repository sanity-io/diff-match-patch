import { DiffType } from '../diff/diff'
import { createPatchObject, Patch } from './createPatchObject'

/**
 * Parse a textual representation of patches and return a list of Patch objects.
 * @param {string} textline Text representation of patches.
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 * @throws {!Error} If invalid input.
 */
export function parse(textline: string): Patch[] {
  const patches = []
  if (!textline) {
    return patches
  }
  const text = textline.split('\n')
  let textPointer = 0
  const patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/
  while (textPointer < text.length) {
    const m = text[textPointer].match(patchHeader)
    if (!m) {
      throw new Error('Invalid patch string: ' + text[textPointer])
    }
    const patch = createPatchObject(parseInt(m[1], 10), parseInt(m[3], 10))
    patches.push(patch)
    if (m[2] === '') {
      patch.start1--
      patch.length1 = 1
    } else if (m[2] === '0') {
      patch.length1 = 0
    } else {
      patch.start1--
      patch.length1 = parseInt(m[2], 10)
    }

    if (m[4] === '') {
      patch.start2--
      patch.length2 = 1
    } else if (m[4] === '0') {
      patch.length2 = 0
    } else {
      patch.start2--
      patch.length2 = parseInt(m[4], 10)
    }
    textPointer++

    while (textPointer < text.length) {
      const sign = text[textPointer].charAt(0)
      let line
      try {
        line = decodeURI(text[textPointer].substring(1))
      } catch (ex) {
        // Malformed URI sequence.
        throw new Error('Illegal escape in patch_fromText: ' + line)
      }
      if (sign === '-') {
        // Deletion.
        patch.diffs.push([DiffType.DELETE, line])
      } else if (sign === '+') {
        // Insertion.
        patch.diffs.push([DiffType.INSERT, line])
      } else if (sign === ' ') {
        // Minor equality.
        patch.diffs.push([DiffType.EQUAL, line])
      } else if (sign === '@') {
        // Start of next patch.
        break
      } else if (sign === '') {
        // Blank line?  Whatever.
      } else {
        // WTF?
        throw new Error('Invalid patch mode "' + sign + '" in: ' + line)
      }
      textPointer++
    }
  }
  return patches
}
