/**
 * Split two texts into an array of strings.  Reduce the texts to a string of
 * hashes where each Unicode character represents one line.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {{chars1: string, chars2: string, lineArray: !Array.<string>}}
 *     An object containing the encoded text1, the encoded text2 and
 *     the array of unique strings.
 *     The zeroth element of the array of unique strings is intentionally blank.
 * @private
 */
export function linesToChars_(text1: string, text2: string) {
  const lineArray = [] // e.g. lineArray[4] === 'Hello\n'
  const lineHash: {[key: string]: number} = {} // e.g. lineHash['Hello\n'] === 4

  // '\x00' is a valid character, but various debuggers don't like it.
  // So we'll insert a junk entry to avoid generating a null character.
  lineArray[0] = ''

  /**
   * Split a text into an array of strings.  Reduce the texts to a string of
   * hashes where each Unicode character represents one line.
   * Modifies linearray and linehash through being a closure.
   * @param {string} text String to encode.
   * @return {string} Encoded string.
   * @private
   */
  function diff_linesToCharsMunge_(text: string) {
    let chars = ''
    // Walk the text, pulling out a substring for each line.
    // text.split('\n') would would temporarily double our memory footprint.
    // Modifying text would create many large strings to garbage collect.
    let lineStart = 0
    let lineEnd = -1
    // Keeping our own length variable is faster than looking it up.
    let lineArrayLength = lineArray.length
    while (lineEnd < text.length - 1) {
      lineEnd = text.indexOf('\n', lineStart)
      if (lineEnd === -1) {
        lineEnd = text.length - 1
      }
      const line = text.substring(lineStart, lineEnd + 1)
      lineStart = lineEnd + 1

      if (
        lineHash.hasOwnProperty
          ? lineHash.hasOwnProperty(line)
          : lineHash[line] !== undefined
      ) {
        chars += String.fromCharCode(lineHash[line])
      } else {
        chars += String.fromCharCode(lineArrayLength)
        lineHash[line] = lineArrayLength
        lineArray[lineArrayLength++] = line
      }
    }
    return chars
  }

  const chars1 = diff_linesToCharsMunge_(text1)
  const chars2 = diff_linesToCharsMunge_(text2)
  return { chars1, chars2, lineArray }
}
