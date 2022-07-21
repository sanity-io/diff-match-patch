import type { Diff } from './diff'

export function cloneDiff(diff: Diff): Diff {
  const [type, patch] = diff
  return [type, patch]
}
