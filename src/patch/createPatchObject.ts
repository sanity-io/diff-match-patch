/**
 * Class representing one patch operation.
 */
import { Diff } from '../diff/diff'

export interface Patch {
  diffs: Diff[]
  start1: number | null
  start2: number | null
  length1: number
  length2: number
}

export function createPatchObject(): Patch {
  return {
    diffs: [],
    start1: null,
    start2: null,
    length1: 0,
    length2: 0,
  }
}
