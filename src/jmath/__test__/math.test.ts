import {
  similarTriangles,
  getCoordsAtDistanceTowardsTarget, honeycombGenerator, rotateMatrix,
  lerpSegmented,
  groupIntoClusters
} from '../math';
import { Vec2 } from '../Vec';

describe('math', () => {
  describe('rotateMatrix', () => {
    it('should rotate the array clockwise once; wide to long', () => {
      const matrix = [
        0, 1, 2,
        3, 4, 5,
      ]
      const actual = rotateMatrix(matrix, 3);
      const expected = {
        contents: [
          3, 0,
          4, 1,
          5, 2
        ], width: 2
      };
      expect(actual).toEqual(expected);
    });
    it('should rotate the array clockwise once; long to wide', () => {
      const matrix = [
        0, 1,
        2, 3,
        4, 5
      ]
      const actual = rotateMatrix(matrix, 2);
      const expected = {
        contents: [
          4, 2, 0,
          5, 3, 1
        ], width: 3
      };
      expect(actual).toEqual(expected);
    });
    it('should rotate the array clockwise once; given a 3x3', () => {
      const matrix = [
        0, 1, 2,
        3, 4, 5,
        6, 7, 8
      ]
      const actual = rotateMatrix(matrix, 3);
      const expected = {
        contents: [
          6, 3, 0,
          7, 4, 1,
          8, 5, 2
        ], width: 3
      };
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
  describe('lerpSegmented', () => {
    const length = 4;
    [
      { t: 0, i: 0, expected: 0 },
      { t: 0, i: 1, expected: 0 },
      { t: 0, i: 2, expected: 0 },
      { t: 0, i: 3, expected: 0 },

      { t: 0.25, i: 0, expected: 1 },
      { t: 0.25, i: 1, expected: 0 },
      { t: 0.25, i: 2, expected: 0 },
      { t: 0.25, i: 3, expected: 0 },

      { t: 0.5, i: 0, expected: 1 },
      { t: 0.5, i: 1, expected: 1 },
      { t: 0.5, i: 2, expected: 0 },
      { t: 0.5, i: 3, expected: 0 },

      { t: 0.75, i: 0, expected: 1 },
      { t: 0.75, i: 1, expected: 1 },
      { t: 0.75, i: 2, expected: 1 },
      { t: 0.75, i: 3, expected: 0 },

      { t: 1, i: 0, expected: 1 },
      { t: 1, i: 1, expected: 1 },
      { t: 1, i: 2, expected: 1 },
      { t: 1, i: 3, expected: 1 },
    ].map(({ t, i, expected }) => {
      it(`t:${t}, i:${i}, length:${length}, expected: ${expected}`, () => {
        expect(lerpSegmented(0, 1, t, i, length)).toEqual(expected);

      })

    })

  });
  describe('groupIntoClusters', () => {
    it('should return empty array if no points are provided', () => {
      const points: Vec2[] = [];
      const result = groupIntoClusters(points);
      expect(result).toEqual([]);
    });

    it.only('should group pairs of points that are closest to each other', () => {
      const points: Vec2[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 10, y: 10 },
        { x: 11, y: 11 },
      ];
      const result = groupIntoClusters(points);
      expect(result.length).toBe(2);
      expect(result).toContainEqual([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
      expect(result).toContainEqual([{ x: 10, y: 10 }, { x: 11, y: 11 }]);
    });

    it('should not reuse points in multiple clusters', () => {
      const points: Vec2[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 0.5, y: 0.5 },
        { x: 10, y: 10 },
        { x: 11, y: 11 },
      ];
      const result = groupIntoClusters(points);
      expect(result.length).toBe(2);
      // Expect no overlapping points across pairs
      const allPoints = new Set(result.flat());
      expect(allPoints.size).toBe(4);
    });

    it('should group pairs only when matching properties are equal', () => {
      interface ColoredVec2 extends Vec2 {
        color: string;
      }

      const points: ColoredVec2[] = [
        { x: 0, y: 0, color: 'red' },
        { x: 1, y: 1, color: 'blue' },
        { x: 10, y: 10, color: 'blue' },
        { x: 11, y: 11, color: 'red' },
        { x: 2, y: 2, color: 'green' },
      ];

      const result = groupIntoClusters(points, ['color']);
      expect(result.length).toBe(2);
      expect(result).toContainEqual([{ x: 0, y: 0, color: 'red' }, { x: 1, y: 1, color: 'red' }]);
      expect(result).toContainEqual([{ x: 10, y: 10, color: 'blue' }, { x: 11, y: 11, color: 'blue' }]);
    });

    it('should handle cases with no pairs matching specified properties', () => {
      interface ColoredVec2 extends Vec2 {
        color: string;
      }

      const points: ColoredVec2[] = [
        { x: 0, y: 0, color: 'red' },
        { x: 1, y: 1, color: 'blue' },
        { x: 10, y: 10, color: 'green' },
        { x: 11, y: 11, color: 'yellow' },
      ];

      const result = groupIntoClusters(points, ['color']);
      expect(result).toEqual([]); // No pairs with matching colors
    });

    it('should group correctly without matching properties when not specified', () => {
      const points: Vec2[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
      ];
      const result = groupIntoClusters(points);
      expect(result.length).toBe(2);
      expect(result).toContainEqual([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
      expect(result).toContainEqual([{ x: 3, y: 3 }, { x: 4, y: 4 }]);
    });

    it('should handle an odd number of points by leaving one point ungrouped', () => {
      const points: Vec2[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 10, y: 10 },
      ];
      const result = groupIntoClusters(points);
      expect(result.length).toBe(1);
      expect(result).toContainEqual([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    });
  });
});
