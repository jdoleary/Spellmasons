import { indexToXY, xyToIndex, normalizeRadians } from '../math';

describe('math', () => {
  describe('normalizeRadiants', () => {
    it('should normalize Math.PI*2 to 0', () => {
      const actual = normalizeRadians(Math.PI * 2);
      const expected = 0;
      expect(actual).toEqual(expected);
    });
    it('should normalize Math.PI*3 to Math.PI', () => {
      const actual = normalizeRadians(Math.PI * 3);
      const expected = Math.PI;
      expect(actual).toEqual(expected);
    });
    it('should normalize -Math.PI to Math.PI', () => {
      const actual = normalizeRadians(-Math.PI);
      const expected = Math.PI;
      expect(actual).toEqual(expected);
    });
    it('should leave numbers between 0 inclusive and Math.PI*2 exclusive as they are', () => {
      const actual = normalizeRadians(Math.PI);
      const expected = Math.PI;
      expect(actual).toEqual(expected);
    });
  });

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
