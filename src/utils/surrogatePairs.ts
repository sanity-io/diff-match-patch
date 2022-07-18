export function isHighSurrogate(char: string): boolean {
  const charCode = char.charCodeAt(0)
  return charCode >= 0xd800 && charCode <= 0xdbff
}

export function isLowSurrogate(char: string): boolean {
  const charCode = char.charCodeAt(0)
  return charCode >= 0xdc00 && charCode <= 0xdfff
}

/**
 * Decode URI-encoded string but allow for encoded surrogate halves
 *
 * diff_match_patch needs this relaxation of the requirements because
 * not all libraries and versions produce valid URI strings in toDelta
 * and we don't want to crash this code when the input is valid input
 * but at the same time invalid utf-8
 *
 * @example: decodeURI( 'abcd%3A %F0%9F%85%B0' ) = 'abcd: \ud83c\udd70'
 * @example: decodeURI( 'abcd%3A %ED%A0%BC' ) = 'abcd: \ud83c'
 *
 * @cite: @mathiasbynens utf8.js at https://github.com/mathiasbynens/utf8.js
 *
 * @param {String} text input string encoded by encodeURI() or equivalent
 * @return {String}
 */
export function surrogateSafeDecodeURI(text: string): string {
  try {
    return decodeURI(text)
  } catch (e) {
    var i = 0
    var decoded = ''

    while (i < text.length) {
      if (text[i] !== '%') {
        decoded += text[i++]
        continue
      }

      // start a percent-sequence
      var byte1 = (digit16(text[i + 1]) << 4) + digit16(text[i + 2])
      if ((byte1 & 0x80) === 0) {
        decoded += String.fromCharCode(byte1)
        i += 3
        continue
      }

      if (text[i + 3] !== '%') {
        throw new URIError('URI malformed')
      }

      var byte2 = (digit16(text[i + 4]) << 4) + digit16(text[i + 5])
      if ((byte2 & 0xc0) !== 0x80) {
        throw new URIError('URI malformed')
      }
      byte2 = byte2 & 0x3f
      if ((byte1 & 0xe0) === 0xc0) {
        decoded += String.fromCharCode(((byte1 & 0x1f) << 6) | byte2)
        i += 6
        continue
      }

      if ('%' !== text[i + 6]) {
        throw new URIError('URI malformed')
      }

      var byte3 = (digit16(text[i + 7]) << 4) + digit16(text[i + 8])
      if ((byte3 & 0xc0) !== 0x80) {
        throw new URIError('URI malformed')
      }

      byte3 = byte3 & 0x3f
      if ((byte1 & 0xf0) === 0xe0) {
        // unpaired surrogate are fine here
        decoded += String.fromCharCode(
          ((byte1 & 0x0f) << 12) | (byte2 << 6) | byte3,
        )
        i += 9
        continue
      }

      if ('%' !== text[i + 9]) {
        throw new URIError('URI malformed')
      }

      var byte4 = (digit16(text[i + 10]) << 4) + digit16(text[i + 11])
      if ((byte4 & 0xc0) !== 0x80) {
        throw new URIError('URI malformed')
      }

      byte4 = byte4 & 0x3f
      if ((byte1 & 0xf8) === 0xf0) {
        const codePoint =
          ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4

        if (codePoint >= 0x010000 && codePoint <= 0x10ffff) {
          decoded += String.fromCharCode(
            (((codePoint & 0xffff) >>> 10) & 0x3ff) | 0xd800,
          )
          decoded += String.fromCharCode(0xdc00 | (codePoint & 0xffff & 0x3ff))
          i += 12
          continue
        }
      }

      throw new URIError('URI malformed')
    }

    return decoded
  }
}

function digit16(char: string) {
  const val = parseInt(char, 16)
  if (isNaN(val)) {
    throw new Error('Invalid hex-code')
  }
  return val
}
