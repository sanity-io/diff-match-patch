// Diff
export {
  diff as makeDiff,
  DiffType,
  type Diff,
  type DiffOptions,
} from './diff/diff'
export { cleanupSemantic, cleanupEfficiency } from './diff/cleanup'

// Match
export { match } from './match/match'

// Patch
export { type Patch } from './patch/createPatchObject'
export { make as makePatches, type MakePatchOptions } from './patch/make'
export {
  apply as applyPatches,
  type PatchResult,
  type ApplyPatchOptions,
} from './patch/apply'
export {
  stringify as stringifyPatches,
  stringifyPatch,
} from './patch/stringify'
export { parse as parsePatch } from './patch/parse'
