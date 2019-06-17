/**
 * Class representing one patch operation.
 */
import { Diff } from '../diff/diff'

export interface Patch {
  diffs: Diff[]
  start1: number
  start2: number
  length1: number
  length2: number
}
export function clone(patch: Patch): Patch {
  return { ...patch, diffs: patch.diffs.map(diff => ({ ...diff })) }
}

export function deepCopy(patches: Patch[]): Patch[] {
  return patches.map(clone)
}
export function createPatchObject(start1: number, start2: number): Patch {
  return {
    diffs: [],
    start1,
    start2,
    length1: 0,
    length2: 0,
  }
}
