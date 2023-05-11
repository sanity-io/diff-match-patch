// Diff
export {
  diff as makeDiff,
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  type DiffType,
  type Diff,
  type DiffOptions,
} from './diff/diff.js'
export {cleanupSemantic, cleanupEfficiency} from './diff/cleanup.js'

// Match
export {match} from './match/match.js'

// Patch
export {type Patch} from './patch/createPatchObject.js'
export {make as makePatches, type MakePatchOptions} from './patch/make.js'
export {apply as applyPatches, type PatchResult, type ApplyPatchOptions} from './patch/apply.js'
export {stringify as stringifyPatches, stringifyPatch} from './patch/stringify.js'
export {parse as parsePatch} from './patch/parse.js'

// UCS-2 utils (beta)
export {adjustIndiciesToUcs2, type AdjustmentOptions} from './utils/utf8Indices.js'
