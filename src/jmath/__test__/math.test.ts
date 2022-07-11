import {
  normalizeRadians, _chooseObjectWithProbability, similarTriangles,
  getCoordsAtDistanceTowardsTarget, honeycombGenerator, rotateMatrix
} from '../math';

describe('math', () => {
  describe('rotateMatrix', () => {
    it('should rotate the array clockwise once; wide to long', () => {
      const matrix = [
        [0, 1, 2],
        [3, 4, 5],
      ]
      const actual = rotateMatrix(matrix);
      const expected = [
        [3, 0],
        [4, 1],
        [5, 2]
      ];
      expect(actual).toEqual(expected);
    });
    it('should rotate the array clockwise once; long to wide', () => {
      const matrix = [
        [0, 1],
        [2, 3],
        [4, 5]
      ]
      const actual = rotateMatrix(matrix);
      const expected = [
        [4, 2, 0],
        [5, 3, 1]
      ];
      expect(actual).toEqual(expected);
    });
    it('should rotate the array clockwise once; given a 3x3', () => {
      const matrix = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
      ]
      const actual = rotateMatrix(matrix);
      const expected = [
        [6, 3, 0],
        [7, 4, 1],
        [8, 5, 2]
      ];
      expect(actual).toEqual(expected);
    });

  });
  describe('honeycombGenerator', () => {
    it('Returns coordinates for a honeycomb or circles', () => {
      const radius = 7;
      const actual = Array.from(honeycombGenerator(radius, { x: 0, y: 0 }, 2));
      const expected = [
        // Relative start point (right, down)
        { x: 2 * radius, y: radius },
        // left down
        { x: 0, y: 2 * radius },
        // left up
        { x: -2 * radius, y: radius },
        // up
        { x: -2 * radius, y: -radius },
        // Right, up
        { x: 0, y: -2 * radius },
        // Right down
        { x: 2 * radius, y: -radius },
      ];
      expect(actual).toEqual(expected);
    });
    it('Returns the correct coordinates for multiple outward layers of honeycomb', () => {
      const radius = 1;
      const actual = Array.from(honeycombGenerator(radius, { x: 0, y: 0 }, 3));
      const expected = [
        // Relative start point (right, down)
        { x: 2 * radius, y: radius },
        // left down
        { x: 0, y: 2 * radius },
        // left up
        { x: -2 * radius, y: radius },
        // up
        { x: -2 * radius, y: -radius },
        // Right, up
        { x: 0, y: -2 * radius },
        // Right down
        { x: 2 * radius, y: -radius },
        // Skip down since it's loop-1 for the down part
        // Next Layer
        // Relative start point (right, down)
        { x: 4 * radius, y: 2 * radius },
        // left down
        { x: 2 * radius, y: 3 * radius },
        { x: 0, y: 4 * radius },
        // left up
        { x: -2 * radius, y: 3 * radius },
        { x: -4 * radius, y: 2 * radius },
        // up
        { x: -4 * radius, y: 0 },
        { x: -4 * radius, y: -2 * radius },
        // Right, up
        { x: -2 * radius, y: -3 * radius },
        { x: 0, y: -4 * radius },
        // Right down
        { x: 2 * radius, y: -3 * radius },
        { x: 4 * radius, y: -2 * radius },
        // Down
        { x: 4 * radius, y: 0 },
      ];
      expect(actual).toEqual(expected);
    });

  });
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
