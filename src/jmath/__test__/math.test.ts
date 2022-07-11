import {
  similarTriangles,
  getCoordsAtDistanceTowardsTarget, honeycombGenerator
} from '../math';

describe('math', () => {
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
});
