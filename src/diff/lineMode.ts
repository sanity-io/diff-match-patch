import { charsToLines_ } from './charsToLines.js'
import { cleanupSemantic } from './cleanup.js'
import { _diff, Diff, DiffType, InternalDiffOptions } from './diff.js'
import { linesToChars_ } from './linesToChars.js'

/**
 * Do a quick line-level diff on both strings, then rediff the parts for
 * greater accuracy.
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
export function lineMode_(
  text1: string,
  text2: string,
  opts: InternalDiffOptions,
): Diff[] {
  // Scan the text on a line-by-line basis first.
  const a = linesToChars_(text1, text2)
  text1 = a.chars1
  text2 = a.chars2
  const linearray = a.lineArray

  let diffs = _diff(text1, text2, {
    checkLines: false,
    deadline: opts.deadline,
  })

  // Convert the diff back to original text.
  charsToLines_(diffs, linearray)
  // Eliminate freak matches (e.g. blank lines)
  diffs = cleanupSemantic(diffs)

  // Rediff any replacement blocks, this time character-by-character.
  // Add a dummy entry at the end.
  diffs.push([DiffType.EQUAL, ''])
  let pointer = 0
  let countDelete = 0
  let countInsert = 0
  let textDelete = ''
  let textInsert = ''
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DiffType.INSERT:
        countInsert++
        textInsert += diffs[pointer][1]
        break
      case DiffType.DELETE:
        countDelete++
        textDelete += diffs[pointer][1]
        break
      case DiffType.EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (countDelete >= 1 && countInsert >= 1) {
          // Delete the offending records and add the merged ones.
          diffs.splice(
            pointer - countDelete - countInsert,
            countDelete + countInsert,
          )
          pointer = pointer - countDelete - countInsert
          const aa = _diff(textDelete, textInsert, {
            checkLines: false,
            deadline: opts.deadline,
          })
          for (let j = aa.length - 1; j >= 0; j--) {
            diffs.splice(pointer, 0, aa[j])
          }
          pointer = pointer + aa.length
        }
        countInsert = 0
        countDelete = 0
        textDelete = ''
        textInsert = ''
        break
    }
    pointer++
  }
  diffs.pop() // Remove the dummy entry at the end.

  return diffs
}
