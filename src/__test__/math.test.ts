import { indexToXY, xyToIndex, normalizeRadians, _chooseObjectWithProbability, similarTriangles, getCoordsAtDistanceTowardsTarget } from '../math';

describe('math', () => {
  describe('probability', () => {
    const objects = [
      // Won't be selected because roll will never be 0 see chooseObjectWithProbability randome.integer(1...
      {
        id: 1,
        probability: 0
      },
      // Selected if roll is 1
      {
        id: 2,
        probability: 1
      },
      // Selected if roll is 2-6
      {
        id: 3,
        probability: 5
      },
      // Wont be selected
      {
        id: 4,
        probability: 0
      },
      // Selected if roll is 7-8
      {

        id: 5,
        probability: 2
      },
    ]
    describe('should never choose an object with probability of 0', () => {
      it("should choose id 2 for roll of 1", () => {
        const choice = _chooseObjectWithProbability(1, objects);
        expect(choice?.id).toEqual(2);
      });
      it("should choose id 3 for roll of 2-6", () => {
        let choice = _chooseObjectWithProbability(2, objects);
        expect(choice?.id).toEqual(3);
        choice = _chooseObjectWithProbability(3, objects);
        expect(choice?.id).toEqual(3);
        choice = _chooseObjectWithProbability(4, objects);
        expect(choice?.id).toEqual(3);
        choice = _chooseObjectWithProbability(5, objects);
        expect(choice?.id).toEqual(3);
        choice = _chooseObjectWithProbability(6, objects);
        expect(choice?.id).toEqual(3);
      });
      it("should choose id 5 for roll of 7-8 because it skips id 4 with a probability of 0", () => {
        let choice = _chooseObjectWithProbability(7, objects);
        expect(choice?.id).toEqual(5);
        choice = _chooseObjectWithProbability(8, objects);
        expect(choice?.id).toEqual(5);
      });
    });

  });
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
  describe('similarTriangles', () => {
    it('should find the x,y value of the point "d" distance along the known triangle hypotenuse D', () => {
      const knownTriangle = { X: 10, Y: 20, D: 100 };
      const desiredDistance = 10;
      const actual = similarTriangles(knownTriangle.X, knownTriangle.Y, knownTriangle.D, desiredDistance);
      const expected = { x: 1, y: 2 };
      expect(actual).toEqual(expected);
    });
    it('should return 0,0 if d (the desired distance) is 0 because the desired distance is 0 so the expected x and y should be at origin', () => {
      const knownTriangle = { X: 10, Y: 20, D: 100 };
      const desiredDistance = 0;
      const actual = similarTriangles(knownTriangle.X, knownTriangle.Y, knownTriangle.D, desiredDistance);
      const expected = { x: 0, y: 0 };
      expect(actual).toEqual(expected);
    });
    it('should return 0,0 if D is 0 (to prevent div by 0)', () => {
      const knownTriangle = { X: 10, Y: 20, D: 0 };
      const desiredDistance = 10;
      const actual = similarTriangles(knownTriangle.X, knownTriangle.Y, knownTriangle.D, desiredDistance);
      const expected = { x: 0, y: 0 };
      expect(actual).toEqual(expected);
    });
  });
  describe('getCoordsDistanceTowardsTarget', () => {
    // Using the known triangle sides 3, 4, and 5 in these tests to make the expected results easy and obvious
    it('should return a coord "travelDist" distance away from "start" along the vector "start" to "end"', () => {
      const start = { x: 3, y: 4 };
      const end = { x: 9, y: 12 };
      const actual = getCoordsAtDistanceTowardsTarget(start, end, 5);
      const expected = { x: 6, y: 8 };
      expect(actual).toEqual(expected);
    });
    it('should return coord "travelDist" distance away from "start" along the vector "start" to "end" even if the start contains greater numbers than the end', () => {
      const start = { x: 9, y: 12 };
      const end = { x: 3, y: 4 };
      const actual = getCoordsAtDistanceTowardsTarget(start, end, 5);
      const expected = { x: 6, y: 8 };
      expect(actual).toEqual(expected);
    });
    it('should return coord "travelDist" distance away from "start" along the vector "end" to "start" (backwards) for a negative travelDist', () => {
      const start = { x: 3, y: 4 };
      const end = { x: 9, y: 12 };
      const actual = getCoordsAtDistanceTowardsTarget(start, end, -5);
      const expected = { x: 0, y: 0 };
      expect(actual).toEqual(expected);
    });
    it('should return target if travelDist is greater than the distance to the target so the returned coords are not beyond the target', () => {
      const start = { x: 3.1253245123, y: 4.4239879812 };
      const target = { x: 10, y: 10 };
      const travelDist = 5000;
      const actual = getCoordsAtDistanceTowardsTarget(start, target, travelDist);
      const expected = target;
      expect(actual).toEqual(expected);
    });
  });
});
