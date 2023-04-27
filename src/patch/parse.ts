import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT} from '../diff/diff.js'
import {createPatchObject, Patch} from './createPatchObject.js'

const patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/

/**
 * Parse a textual representation of patches and return a list of Patch objects.
 *
 * @param textline - Text representation of patches.
 * @returns Array of Patch objects.
 * @public
 */
export function parse(textline: string): Patch[] {
  const patches: Patch[] = []
  if (!textline) {
    return patches
  }
  const text = textline.split('\n')
  let textPointer = 0
  while (textPointer < text.length) {
    const m = text[textPointer].match(patchHeader)
    if (!m) {
      throw new Error(`Invalid patch string: ${text[textPointer]}`)
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
        throw new Error(`Illegal escape in parse: ${line}`)
      }
      if (sign === '-') {
        // Deletion.
        patch.diffs.push([DIFF_DELETE, line])
      } else if (sign === '+') {
        // Insertion.
        patch.diffs.push([DIFF_INSERT, line])
      } else if (sign === ' ') {
        // Minor equality.
        patch.diffs.push([DIFF_EQUAL, line])
      } else if (sign === '@') {
        // Start of next patch.
        break
      } else if (sign === '') {
        // Blank line?  Whatever.
      } else {
        // WTF?
        throw new Error(`Invalid patch mode "${sign}" in: ${line}`)
      }
      textPointer++
    }
  }
  return patches
}
