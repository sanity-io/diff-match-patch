import { addContext_ } from '../make'
import { parse } from '../parse'
import { stringifyPatch } from '../stringify'

test('addContext', () => {
  let p = parse('@@ -21,4 +21,10 @@\n-jump\n+somersault\n')[0]
  addContext_(p, 'The quick brown fox jumps over the lazy dog.', { margin: 4 })
  expect(stringifyPatch(p)).toBe(
    '@@ -17,12 +17,18 @@\n fox \n-jump\n+somersault\n s ov\n',
  )

  // Same, but not enough trailing context.
  p = parse('@@ -21,4 +21,10 @@\n-jump\n+somersault\n')[0]
  addContext_(p, 'The quick brown fox jumps.', { margin: 4 })
  expect(stringifyPatch(p)).toBe(
    '@@ -17,10 +17,16 @@\n fox \n-jump\n+somersault\n s.\n',
  )

  // Same, but not enough leading context.
  p = parse('@@ -3 +3,2 @@\n-e\n+at\n')[0]
  addContext_(p, 'The quick brown fox jumps.', { margin: 4 })
  expect(stringifyPatch(p)).toBe('@@ -1,7 +1,8 @@\n Th\n-e\n+at\n  qui\n')

  // Same, but with ambiguity.
  p = parse('@@ -3 +3,2 @@\n-e\n+at\n')[0]
  addContext_(p, 'The quick brown fox jumps.  The quick brown fox crashes.', {
    margin: 4,
  })
  expect(stringifyPatch(p)).toBe(
    '@@ -1,27 +1,28 @@\n Th\n-e\n+at\n  quick brown fox jumps. \n',
  )
})
