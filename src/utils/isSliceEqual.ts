export function isSliceEqual(
  array1: string[],
  array2: string[],
  from1: number,
  to1: number,
  from2: number,
  to2: number,
): boolean {
  const len = Math.max(to1 - from1, to2 - from2)
  for (let i = 0; i < len; i++) {
    if (array1[from1 + i] !== array2[from2 + i]) {
      return false
    }
  }
  return true
}
