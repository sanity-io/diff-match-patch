export function isStringArrayEqual(str: string[], otherStr: string[]): boolean {
  if (str.length !== otherStr.length) {
    return false
  }
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== otherStr[i]) {
      return false
    }
  }
  return true
}
