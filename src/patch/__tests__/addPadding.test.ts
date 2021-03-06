import { addPadding } from '../apply'
import { make } from '../make'
import { stringify } from '../stringify'

test('addPadding', () => {
  // Both edges full.
  let patches = make('', 'test')
  expect(stringify(patches)).toBe('@@ -0,0 +1,4 @@\n+test\n')
  addPadding(patches)
  expect(stringify(patches)).toBe(
    '@@ -1,8 +1,12 @@\n %01%02%03%04\n+test\n %01%02%03%04\n',
  )

  // Both edges partial.
  patches = make('XY', 'XtestY')
  expect(stringify(patches)).toBe('@@ -1,2 +1,6 @@\n X\n+test\n Y\n')
  addPadding(patches)
  expect(stringify(patches)).toBe(
    '@@ -2,8 +2,12 @@\n %02%03%04X\n+test\n Y%01%02%03\n',
  )

  // Both edges none.
  patches = make('XXXXYYYY', 'XXXXtestYYYY')
  expect(stringify(patches)).toBe('@@ -1,8 +1,12 @@\n XXXX\n+test\n YYYY\n')
  addPadding(patches)
  expect(stringify(patches)).toBe('@@ -5,8 +5,12 @@\n XXXX\n+test\n YYYY\n')
})
