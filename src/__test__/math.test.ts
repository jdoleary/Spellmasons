import { indexToXY, xyToIndex } from '../math';

describe('math', () => {
  describe('should take an index and a width of a rectangle and return the x,y coordinates of the cell which is at that index if counted from left to right and top to bottom', () => {
    const testPairs = [
      {
        coords: { x: 1, y: 0 },
        index: 1,
        width: 10,
      },
      {
        coords: { x: 1, y: 1 },
        index: 11,
        width: 10,
      },
      {
        coords: { x: 0, y: 1 },
        index: 10,
        width: 10,
      },
      {
        coords: { x: 1, y: 1 },
        index: 7,
        width: 6,
      },
      {
        coords: { x: 0, y: 2 },
        index: 12,
        width: 6,
      },
    ];
    for (let { coords, index, width } of testPairs) {
      it(`indexToXY: Coords: ${JSON.stringify(
        coords,
      )}; index: ${index}; width: ${width}`, () => {
        const expected = coords;
        const acutal = indexToXY(index, width);
        expect(acutal).toEqual(expected);
      });
      it(`xyToIndex: Coords: ${JSON.stringify(
        coords,
      )}; index: ${index}; width: ${width}`, () => {
        const expected = index;
        const acutal = xyToIndex(coords, width);
        expect(acutal).toEqual(expected);
      });
    }
  });
});
