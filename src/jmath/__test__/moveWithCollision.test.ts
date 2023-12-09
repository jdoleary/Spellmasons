const { performance } = require('perf_hooks');
import type { Vec2 } from '../Vec';
import type { LineSegment } from '../lineSegment';
import {
    Circle,
    isCircleIntersectingCircle,
    moveWithCollisions,
    moveAlongVector,
    moveAwayFrom,
    normalizedVector,
    testables
} from '../moveWithCollision';
const { repelCircles, repelCircleFromLine } = testables;

describe('repelCircles', () => {
    it('should only repel the mover if the other colliding circle is fixed (immovable)', () => {
        const mover: Circle = { x: -1, y: 0, radius: 2 };
        const otherStartPosition = { x: 4, y: 0 };
        const other: Circle = { ...otherStartPosition, radius: 2 };
        const destination = { x: 1, y: 0 };
        const originalPosition = { x: mover.x, y: mover.y };
        mover.x = destination.x;
        mover.y = destination.y;
        // This is the flag that ensures "other" does not move when the collision occurs
        const otherIsFixed = true;
        // Stub pathingLineSegment
        const underworld = { pathingLineSegments: [] };
        // @ts-ignore, underworld is a stub
        repelCircles(mover, originalPosition, other, underworld, otherIsFixed);
        const actual = { x: other.x, y: other.y };
        const expected = otherStartPosition;
        // Assert that "other" did NOT move
        expect(actual).toEqual(expected);
        // Ensure that the mover did move, if mover did not move at all then this test is likely broken
        expect(mover.x).toEqual(0);
    });
})
describe('moveWithCollisions', () => {
    it("should travel to it's destination if unobstructed", () => {
        const c1: Circle = { x: 0, y: 0, radius: 2 };
        const destination = { x: 2, y: 2 };
        //@ts-ignore: underworld is undefined in this test because it is not needed
        moveWithCollisions(c1, destination, [], undefined);
        const actual = { x: c1.x, y: c1.y };
        const expected = destination;
        expect(actual).toEqual(expected);
    });
    // In use this function will be used on the array containing ALL circles so
    // it will probably include the mover in the circles array, so we don't
    // want the circle to run collision math on itself
    it("should not make a circle collide with itself", () => {
        const c1: any = { x: 0, y: 0, radius: 5, immovable: false };
        const destination = { x: 1, y: 0 };
        //@ts-ignore: underworld is undefined in this test because it is not needed
        moveWithCollisions(c1, destination, [c1], undefined);
        const actual = { x: c1.x, y: c1.y };
        const expected = destination;
        expect(actual).toEqual(expected);
    });
    describe.skip('colliding circles', () => {
        describe('performance', () => {
            it('should support calculating collisions for 1000 circles in under 16 milliseconds', () => {
                performance.mark('moveWithCollisions-start');
                const c1: Circle = { x: -1000, y: 0, radius: 2 };
                const numberOfCollidingCircles = 1000;
                const circles: any[] = [];
                for (let n = 0; n < numberOfCollidingCircles; n++) {
                    circles.push({ x: 6, y: 0, radius: 5, immovable: false });
                }
                const destination = { x: 0, y: 0 };
                // @ts-ignore: No underworld needed for this test, so it is set to undefined
                moveWithCollisions(c1, destination, circles, undefined);
                const { duration } = performance.measure(
                    'end',
                    'moveWithCollisions-start',
                );
                expect(duration).toBeLessThan(16);
            });
        });

        // describe("multiple colliders", () => {
        // it("should push other circles if it moves into them", () => {
        //     // These circles start touching and with the same radius,
        //     // so they should split the movement distance
        //     const c1: Circle = {  x: 0, y: 0, radius: 2 };
        //     const circles: Circle[] = [
        //         {  x: 2, y: 1, radius: 2 },
        //         {  x: 2, y: -1, radius: 2 }
        //     ];
        //     const destination = { x: 2, y: 0 };
        //     move(c1, destination, circles);
        //     const actual = circles[0].position;
        //     const expected = { x: 2, y: 3 };
        //     expect(actual).toEqual(expected);
        // });
        // it("should not travel as far as it would unobstructed if it pushes another circle", () => {
        // });
        // });
    });
    // POSSIBLE FUTURE TASK: For the purposes that this system is built for, larger radius == larger mass
    // it("should push another circle if it moves into it relative to it's radius", () => {
    // });
});
describe('isCircleIntersectingCircle', () => {
    it('should return true if circles are intersecting', () => {
        const c1: Circle = { x: 0, y: 0, radius: 2 };
        const c2: Circle = { x: 1, y: 0, radius: 2 };
        const actual = isCircleIntersectingCircle(c1, c2);
        const expected = true;
        expect(actual).toEqual(expected);
    });
    it('should return false if circles are not intersecting', () => {
        const c1: Circle = { x: 0, y: 0, radius: 2 };
        const c2: Circle = { x: 300, y: 0, radius: 2 };
        const actual = isCircleIntersectingCircle(c1, c2);
        const expected = false;
        expect(actual).toEqual(expected);
    });
    describe('differing radiuses', () => {
        it('should return if true circles are intersecting', () => {
            const c1: Circle = { x: 0, y: 0, radius: 2 };
            const c2: Circle = { x: 5, y: 0, radius: 4 };
            const actual = isCircleIntersectingCircle(c1, c2);
            const expected = true;
            expect(actual).toEqual(expected);
        });
    });
});
describe('normalizedVector', () => {
    it('should return the normalized vector between two points', () => {
        const p1 = { x: 1, y: 0 };
        const p2 = { x: 3, y: 0 };
        const actual = normalizedVector(p1, p2);
        const expected = { vector: { x: 1, y: 0 }, distance: 2 };
        expect(actual).toEqual(expected);
    });
    it('should return the normalized vector between two points (example 2)', () => {
        const p1 = { x: 0, y: 1 };
        const p2 = { x: 0, y: 10 };
        const actual = normalizedVector(p1, p2);
        const expected = { vector: { x: 0, y: 1 }, distance: 9 };
        expect(actual).toEqual(expected);
    });
    it('should return the normalized vector between two points (example 3)', () => {
        const p1 = { x: 1, y: 1 };
        const p2 = { x: 1 + 3, y: 1 + 4 };
        const actual = normalizedVector(p1, p2);
        const expected = { vector: { x: 0.6, y: 0.8 }, distance: 5 };
        expect(actual).toEqual(expected);
    });
    it('should return {vector:undefined, distance:0} if the two points are the same', () => {
        const p1 = { x: 1, y: 1 };
        const p2 = { x: 1, y: 1 };
        const actual = normalizedVector(p1, p2);
        const expected = { vector: undefined, distance: 0 };
        expect(actual).toEqual(expected);
    });
});
describe('moveAlongVector', () => {
    it('should returns a new coordinate representing "startPos" moved "distance" along "normalizedVector"', () => {
        const start = { x: 1, y: 1 };
        const vector = { x: 0.6, y: 0.8 };
        const distance = 5;
        const actual = moveAlongVector(start, vector, distance);
        const expected = { x: 4, y: 5 };
        expect(actual).toEqual(expected);
    });
});
describe('moveAwayFrom', () => {
    it('should move the circle away from "from" until "from" is at the edge of the circle', () => {
        const c1: Circle = { x: 1, y: 0, radius: 3 };
        const from: Vec2 = { x: 3, y: 0 };
        moveAwayFrom(c1, from);
        const actual = { x: c1.x, y: c1.y };
        const expected = { x: 0, y: 0 };
        expect(actual).toEqual(expected);
    });
    it('should move the circle away from "from" until "from" is at the edge of the circle (example 2)', () => {
        const initialPosition = { x: 1, y: 0 };
        const c1: Circle = {
            ...Object.assign({}, initialPosition),
            radius: 10,
        };
        const from: Vec2 = { x: 0, y: 0 };
        moveAwayFrom(c1, from);
        const actual = { x: c1.x, y: c1.y };
        const expected = { x: 10, y: 0 };
        expect(actual).toEqual(expected);
    });
    it('should move the circle away from "from" until "from" is at the edge of the circle (works with angles)', () => {
        // This test uses the common triangle: x,x,x*sqrt(2)
        // to make the expected result more obvious
        const c1: Circle = { x: 1, y: 1, radius: 6 * Math.sqrt(2) };
        const from: Vec2 = { x: 1 + 3, y: 1 + 3 };
        moveAwayFrom(c1, from);
        const actual = {
            x: Math.round(c1.x),
            y: Math.round(c1.y),
        };
        const expected = { x: -2, y: -2 };
        expect(actual).toEqual(expected);
    });
});

describe.skip('repelCircleFromLine', () => {
    describe('performance', () => {
        it('should support calculating collisions with 1000 line segments in under 16 milliseconds', () => {
            performance.mark('repelCircleFromLine-start');
            const c1: Circle = { x: 4, y: 0, radius: 2 };
            const numberOfCollidingLines = 1000;
            const lineSegments: LineSegment[] = [];
            for (let n = 0; n < numberOfCollidingLines; n++) {
                lineSegments.push(
                    { p1: { x: 0, y: 10 }, p2: { x: 0, y: -10 } }
                );
            }
            const destination = { x: 0, y: 0 };
            // Actually move the mover
            c1.x = destination.x;
            c1.y = destination.y;
            for (let line of lineSegments) {
                // @ts-ignore underworld force set to undefined for this test
                repelCircleFromLine(c1, line, undefined);
            }
            const { duration } = performance.measure(
                'end',
                'repelCircleFromLine-start',
            );
            expect(duration).toBeLessThan(16);
        });
    });
    it('should prevent a circle from moving through a line', () => {
        const c1: Circle = { x: 4, y: 0, radius: 2 };
        const line: LineSegment =
            { p1: { x: 0, y: 10 }, p2: { x: 0, y: -10 } }

        const destination = { x: 0, y: 0 }
        // Actually move the mover
        c1.x = destination.x;
        c1.y = destination.y;
        // @ts-ignore underworld force set to undefined for this test
        repelCircleFromLine(c1, line);
        expect(c1.x).toEqual(2);
    });
    it('should prevent a circle from moving into intersection with an endpoint of the line', () => {
        const c1: Circle = { x: 4, y: 1, radius: 2 };
        const line: LineSegment =
            { p1: { x: 0, y: 10 }, p2: { x: 0, y: 0 } }

        const destination = { x: 0, y: 1 }
        // Actually move the mover
        c1.x = destination.x;
        c1.y = destination.y;
        // @ts-ignore forcing underworld to undefined for this test
        repelCircleFromLine(c1, line);
        expect(c1.x).toEqual(2);
        expect(c1.y).toEqual(1);
    });
    it('should work even when line is parallel to movement direction of circle', () => {
        const c1: Circle = { x: 4, y: 0, radius: 2 };
        const line: LineSegment =
            { p1: { x: -10, y: 0 }, p2: { x: 0, y: 0 } }

        const destination = { x: 0, y: 0 }
        // Actually move the mover
        c1.x = destination.x;
        c1.y = destination.y;
        // @ts-ignore forcing underworld to undefined for this test
        repelCircleFromLine(c1, line, undefined);
        expect(c1.x).toEqual(2);
    });
});