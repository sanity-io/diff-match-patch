import { DiffType } from '../diff'
import { xIndex } from '../xIndex'

test('xIndex', () => {
  // Translate a location in text1 to text2.
  // Translation on equality.
  expect(
    xIndex(
      [
        [DiffType.DELETE, 'a'],
        [DiffType.INSERT, '1234'],
        [DiffType.EQUAL, 'xyz'],
      ],
      2,
    ),
  ).toEqual(5)

  // Translation on deletion.
  expect(
    xIndex(
      [
        [DiffType.EQUAL, 'a'],
        [DiffType.DELETE, '1234'],
        [DiffType.EQUAL, 'xyz'],
      ],
      3,
    ),
  ).toEqual(1)
})
