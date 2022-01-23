const { performance } = require('perf_hooks');
import type { Vec2 } from '../../commonTypes';
import type { LineSegment } from '../collisionMath';
import {
    Circle,
    isCircleIntersectingCircle,
    moveWithCollisions,
    moveAlongVector,
    moveAwayFrom,
    normalizedVector,
    moveWithLineCollisions,
    testables
} from '../moveWithCollision';
const { repelCircles } = testables;

describe('repelCircles', () => {
    it('should only repel the mover if the other colliding circle is fixed (immovable)', () => {
        const mover: Circle = { position: { x: -1, y: 0 }, radius: 2 };
        const otherStartPosition = { x: 4, y: 0 };
        const other: Circle = { position: { ...otherStartPosition }, radius: 2 };
        const destination = { x: 1, y: 0 };
        const originalPosition = { x: mover.position.x, y: mover.position.y };
        mover.position = destination;
        // This is the flag that ensures "other" does not move when the collision occurs
        const otherIsFixed = true;
        repelCircles(mover, originalPosition, other, otherIsFixed);
        const actual = other.position;
        const expected = otherStartPosition;
        // Assert that "other" did NOT move
        expect(actual).toEqual(expected);
        // Ensure that the mover did move, if mover did not move at all then this test is likely broken
        expect(mover.position.x).toEqual(0);
    });
})
describe('moveWithCollisions', () => {
    it("should travel to it's destination if unobstructed", () => {
        const c1: Circle = { position: { x: 0, y: 0 }, radius: 2 };
        const destination = { x: 2, y: 2 };
        moveWithCollisions(c1, destination, []);
        const actual = c1.position;
        const expected = destination;
        expect(actual).toEqual(expected);
    });
    // In use this function will be used on the array containing ALL circles so
    // it will probably include the mover in the circles array, so we don't
    // want the circle to run collision math on itself
    it("should not make a circle collide with itself", () => {
        const c1: Circle = { position: { x: 0, y: 0 }, radius: 5 };
        const destination = { x: 1, y: 0 };
        moveWithCollisions(c1, destination, [c1]);
        const actual = c1.position;
        const expected = destination;
        expect(actual).toEqual(expected);
    });
    describe('colliding circles', () => {
        describe('performance', () => {
            it('should support calculating collisions for 1000 circles in under 16 milliseconds', () => {
                performance.mark('moveWithCollisions-start');
                const c1: Circle = { position: { x: -1000, y: 0 }, radius: 2 };
                const numberOfCollidingCircles = 1000;
                const circles: Circle[] = [];
                for (let n = 0; n < numberOfCollidingCircles; n++) {
                    circles.push({ position: { x: 6, y: 0 }, radius: 5 });
                }
                const destination = { x: 0, y: 0 };
                moveWithCollisions(c1, destination, circles);
                const { duration } = performance.measure(
                    'end',
                    'moveWithCollisions-start',
                );
                expect(duration).toBeLessThan(16);
            });
        });
        it('should push another circle if it moves into it', () => {
            // These circles start touching and with the same radius,
            // so they should split the movement distance
            const c1: Circle = { position: { x: -1000, y: 0 }, radius: 2 };
            const circles: Circle[] = [{ position: { x: 6, y: 0 }, radius: 5 }];
            const destination = { x: 0, y: 0 };
            moveWithCollisions(c1, destination, circles);
            const actual = circles[0].position;
            const expected = { x: 6.5, y: 0 };
            expect(actual).toEqual(expected);
        });
        it('should not travel as far as it would unobstructed if it pushes another circle', () => {
            // These circles start touching and with the same radius,
            // so they should split the movement distance
            const c1: Circle = { position: { x: 0, y: 0 }, radius: 2 };
            const circles: Circle[] = [{ position: { x: 4, y: 0 }, radius: 2 }];
            const destination = { x: 1, y: 0 };
            moveWithCollisions(c1, destination, circles);
            const actual = c1.position;
            const expected = { x: 0.5, y: 0 };
            expect(actual).toEqual(expected);
        });
        it("should not travel as far as it would unobstructed if it pushes another circle (even if the destination is exactly equal to the other circle's position)", () => {
            // These circles start touching and with the same radius,
            // so they should split the movement distance
            const c1: Circle = { position: { x: 0, y: 0 }, radius: 2 };
            const circles: Circle[] = [{ position: { x: 4, y: 0 }, radius: 2 }];
            const destination = { x: 4, y: 0 };
            moveWithCollisions(c1, destination, circles);
            const actual = c1.position;
            // It only moves half as far as it intended since it starts touching another
            // circle of the same radius and tries to move exactly into it
            const expected = { x: 2, y: 0 };
            expect(actual).toEqual(expected);
        });
        describe('collisions at non direct angles', () => {
            // Collision force transfer happens at the endpoint of the movement,
            // it is expected that many small movements will occur over time, so
            // this collision system calculates discrete collisions: only
            // the destination is considered, so, by design, if the destination
            // would have c1 travel THROUGH another circle, it would not
            // detect collision
            it('should push another circle if it moves into it', () => {
                const c1: Circle = { position: { x: 0, y: 0 }, radius: 2 };
                const circles: Circle[] = [{ position: { x: 2, y: 0 }, radius: 2 }];
                const destination = { x: 2, y: 2 };
                moveWithCollisions(c1, destination, circles);
                const actual = circles[0].position;
                const expected = { x: 2, y: -1 };
                expect(actual).toEqual(expected);
            });
            it('should not travel as far as it would unobstructed if it pushes another circle', () => {
                const c1: Circle = { position: { x: 0, y: 0 }, radius: 2 };
                const circles: Circle[] = [{ position: { x: 2, y: 0 }, radius: 2 }];
                const destination = { x: 2, y: 2 };
                moveWithCollisions(c1, destination, circles);
                const actual = c1.position;
                const expected = { x: 2, y: 3 };
                expect(actual).toEqual(expected);
            });
        });
        // describe("multiple colliders", () => {
        // it("should push other circles if it moves into them", () => {
        //     // These circles start touching and with the same radius,
        //     // so they should split the movement distance
        //     const c1: Circle = { position: { x: 0, y: 0 }, radius: 2 };
        //     const circles: Circle[] = [
        //         { position: { x: 2, y: 1 }, radius: 2 },
        //         { position: { x: 2, y: -1 }, radius: 2 }
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
        const c1: Circle = { position: { x: 0, y: 0 }, radius: 2 };
        const c2: Circle = { position: { x: 1, y: 0 }, radius: 2 };
        const actual = isCircleIntersectingCircle(c1, c2);
        const expected = true;
        expect(actual).toEqual(expected);
    });
    it('should return false if circles are not intersecting', () => {
        const c1: Circle = { position: { x: 0, y: 0 }, radius: 2 };
        const c2: Circle = { position: { x: 300, y: 0 }, radius: 2 };
        const actual = isCircleIntersectingCircle(c1, c2);
        const expected = false;
        expect(actual).toEqual(expected);
    });
    describe('differing radiuses', () => {
        it('should return if true circles are intersecting', () => {
            const c1: Circle = { position: { x: 0, y: 0 }, radius: 2 };
            const c2: Circle = { position: { x: 5, y: 0 }, radius: 4 };
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
        const c1: Circle = { position: { x: 1, y: 0 }, radius: 3 };
        const from: Vec2 = { x: 3, y: 0 };
        moveAwayFrom(c1, from);
        const actual = c1.position;
        const expected = { x: 0, y: 0 };
        expect(actual).toEqual(expected);
    });
    it('should move the circle away from "from" until "from" is at the edge of the circle (example 2)', () => {
        const initialPosition = { x: 1, y: 0 };
        const c1: Circle = {
            position: Object.assign({}, initialPosition),
            radius: 10,
        };
        const from: Vec2 = { x: 0, y: 0 };
        moveAwayFrom(c1, from);
        const actual = c1.position;
        const expected = { x: 10, y: 0 };
        expect(actual).toEqual(expected);
    });
    it('should move the circle away from "from" until "from" is at the edge of the circle (works with angles)', () => {
        // This test uses the common triangle: x,x,x*sqrt(2)
        // to make the expected result more obvious
        const c1: Circle = { position: { x: 1, y: 1 }, radius: 6 * Math.sqrt(2) };
        const from: Vec2 = { x: 1 + 3, y: 1 + 3 };
        moveAwayFrom(c1, from);
        const actual = {
            x: Math.round(c1.position.x),
            y: Math.round(c1.position.y),
        };
        const expected = { x: -2, y: -2 };
        expect(actual).toEqual(expected);
    });
});

describe('moveWithLineCollisions', () => {
    describe('performance', () => {
        it('should support calculating collisions with 1000 line segments in under 16 milliseconds', () => {
            performance.mark('moveWithLineCollisions-start');
            const c1: Circle = { position: { x: 4, y: 0 }, radius: 2 };
            const numberOfCollidingLines = 1000;
            const lineSegments: LineSegment[] = [];
            for (let n = 0; n < numberOfCollidingLines; n++) {
                lineSegments.push(
                    { p1: { x: 0, y: 10 }, p2: { x: 0, y: -10 } }
                );
            }
            const destination = { x: 0, y: 0 };
            moveWithLineCollisions(c1, destination, lineSegments);
            const { duration } = performance.measure(
                'end',
                'moveWithLineCollisions-start',
            );
            expect(duration).toBeLessThan(16);
        });
    });
    it('should prevent a circle from moving through a line', () => {
        const c1: Circle = { position: { x: 4, y: 0 }, radius: 2 };
        const lines: LineSegment[] = [
            { p1: { x: 0, y: 10 }, p2: { x: 0, y: -10 } }
        ]
        const destination = { x: 0, y: 0 }
        moveWithLineCollisions(c1, destination, lines);
        expect(c1.position.x).toEqual(2);
    });
    it('should prevent a circle from moving into intersection with an endpoint of the line', () => {
        const c1: Circle = { position: { x: 4, y: 1 }, radius: 2 };
        const lines: LineSegment[] = [
            { p1: { x: 0, y: 10 }, p2: { x: 0, y: 0 } }
        ]
        const destination = { x: 0, y: 1 }
        moveWithLineCollisions(c1, destination, lines);
        expect(c1.position).toEqual({ x: 2, y: 1 });
    });
    it('should work even when line is parallel to movement direction of circle', () => {
        const c1: Circle = { position: { x: 4, y: 0 }, radius: 2 };
        const lines: LineSegment[] = [
            { p1: { x: -10, y: 0 }, p2: { x: 0, y: 0 } }
        ]
        const destination = { x: 0, y: 0 }
        moveWithLineCollisions(c1, destination, lines);
        expect(c1.position.x).toEqual(2);
    });
});