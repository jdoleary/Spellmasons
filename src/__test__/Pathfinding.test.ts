import type { LineSegment } from '../collision/collisionMath';
import type { Vec2 } from '../commonTypes';
import { generateConvexPolygonMesh, findPath, testables, Point } from '../Pathfinding';
const { split, lineSegmentsToPoints, getAngleBetweenVec2s, isAngleBetweenAngles, normalizeAngle, counterClockwiseAngle } = testables;

describe("Pathfinding", () => {
    describe("generateConvexPolygonMesh", () => {
        it('should generate a mesh of convex polygons from a list of lineSegments', () => {
            const lineSegments: LineSegment[] = [
                // Outside bounds
                { p1: { x: 0, y: 0 }, p2: { x: 4, y: 0 } },
                { p1: { x: 4, y: 0 }, p2: { x: 4, y: 4 } },
                { p1: { x: 4, y: 4 }, p2: { x: 0, y: 4 } },
                { p1: { x: 0, y: 4 }, p2: { x: 0, y: 0 } },

                { p1: { x: 1, y: 2 }, p2: { x: 1, y: 1 } },
                { p1: { x: 1, y: 1 }, p2: { x: 2, y: 1 } },
                { p1: { x: 2, y: 1 }, p2: { x: 2, y: 2 } },
                { p1: { x: 2, y: 2 }, p2: { x: 1, y: 2 } },
            ];
            const points = generateConvexPolygonMesh(lineSegments, 0);
            expect(points[9].hub).toEqual({ x: 1, y: 1 });
            expect(points[9].connections).toEqual([
                { x: 0, y: 0 },
                { x: 2, y: 1 },
                { x: 1, y: 2 }
            ]);
        });
        it.only('should support inset', () => {
            const lineSegments: LineSegment[] = [
                // Outside bounds
                { p1: { x: 0, y: 0 }, p2: { x: 400, y: 0 } },
                { p1: { x: 400, y: 0 }, p2: { x: 400, y: 400 } },
                { p1: { x: 400, y: 400 }, p2: { x: 0, y: 400 } },
                { p1: { x: 0, y: 400 }, p2: { x: 0, y: 0 } },

                { p1: { x: 100, y: 200 }, p2: { x: 100, y: 100 } },
                { p1: { x: 100, y: 100 }, p2: { x: 200, y: 100 } },
                { p1: { x: 200, y: 100 }, p2: { x: 200, y: 200 } },
                { p1: { x: 200, y: 200 }, p2: { x: 100, y: 200 } },
            ];
            const points = generateConvexPolygonMesh(lineSegments, 10);
            // Note: These test values may need to be tweaked later, but will
            // do for now 
            expect(points[5].hub).toEqual({ x: 93, y: 92 });
            expect(points[5].connections).toEqual([
                { x: -7, y: -7 },
                { x: 208, y: 93 },
                { x: 93, y: 207 }
            ]);

        });
    });
    describe("findPath", () => {
        describe("given a pathing mesh", () => {
            // TODO
            it('should return Vec2[] of a path that, when followed, leads from the "from" Vec2 to the "to" Vec2', () => { });
        });
    });
    describe('counterClockwiseAngle', () => {
        const testPairs = [
            [135, -135, 90],
            [-45, 45, 90],
            [45, -45, 270],
            [-90, 355, 85]
        ];
        for (let [from, to, expected] of testPairs) {
            it(`should return the angle going counterclockwise between the angles ${from} and ${to}`, () => {
                const actual = counterClockwiseAngle(from * Math.PI / 180, to * Math.PI / 180) * 180 / Math.PI;
                expect(actual).toEqual(expected);
            });
        }

    });
    describe("getAngleBetweenVec2s", () => {
        it('should find the angle in radians between 2 Vec2s', () => {
            const p1 = { x: 1, y: 1 };
            const p2 = { x: 1, y: 2 };
            const actual = getAngleBetweenVec2s(p1, p2);
            const expected = Math.PI / 2;
            expect(actual).toEqual(expected);
        });
    });
    describe("normalizeAngle", () => {
        it("should return an angle between -Math.PI and Math.PI (positive example)", () => {
            const angle = Math.PI * 5;
            const actual = normalizeAngle(angle);
            const expected = Math.PI;
            expect(actual).toEqual(expected);

        });
        it("should not change the angle if it is already between 0 and 360", () => {
            const angle = Math.PI / 2;
            const actual = normalizeAngle(angle);
            const expected = angle;
            expect(actual).toEqual(expected);

        });
        it("should return an angle between -Math.PI and Math.PI (negative example)", () => {
            const angle = -3 * Math.PI / 2;
            const actual = normalizeAngle(angle) * 180 / Math.PI;
            const expected = 90;
            expect(actual).toEqual(expected);
        });

    });
    describe("isAngleBetweenAngles", () => {
        const testGroups: [number, number, number, boolean][] = [
            [0, -Math.PI / 2, Math.PI / 2, true],
            [2 * Math.PI - 0.1, -Math.PI / 2, Math.PI / 2, true],
            [0, Math.PI / 2, -Math.PI / 2, false],
            [Math.PI, Math.PI / 2, -Math.PI / 2, true],
            [-3 * Math.PI / 4, Math.PI / 2, 0, true],

        ];
        for (let [testAngle, angleLowerBound, angleUpperBound, expected] of testGroups) {
            it(`should return ${expected} for ${testAngle * 180 / Math.PI} between ${angleLowerBound * 180 / Math.PI} and ${angleUpperBound * 180 / Math.PI}`, () => {
                const actual = isAngleBetweenAngles(testAngle, angleLowerBound, angleUpperBound);
                expect(actual).toEqual(expected);
            });
        }
    });
    describe("split", () => {
        it("should take a Point and add connections to other points until none of the angles between the point.hub and its connections are > 180 degress", () => {
            const hub = { x: 0, y: 0 };
            const c1 = { x: 1, y: 1 };
            const c2 = { x: -1, y: 1 };
            const point: Point = { hub, connections: [c1, c2] };
            const point2 = { hub: { x: 0, y: -1 }, connections: [] };
            const allPoints: Point[] = [
                point,
                point2,
            ];
            split(point, allPoints);
            const mutatedPoint = { hub: point.hub, connections: [point2.hub, c1, c2,] };
            expect(point).toEqual(mutatedPoint);
        });
        it("should prefer the biggest split it can find so we don't have too many unnecessary polygons", () => {
            const hub = { x: 0, y: 0 };
            const c1 = { x: 1, y: 1 };
            const c2 = { x: -1, y: 1 };
            const point: Point = { hub, connections: [c1, c2] };
            const point_no_connect_1 = { hub: { x: -1, y: -1 }, connections: [] };
            // We want it to connect to point_desired, so it only has to make 1 extra connection,
            // even though it could make convex polygons by making all of the possible connections
            const point_desired = { hub: { x: 0, y: -1 }, connections: [] };
            const point_no_connect_2 = { hub: { x: 1, y: -1 }, connections: [] };
            const allPoints: Point[] = [
                point,
                point_no_connect_1,
                point_desired,
                point_no_connect_2
            ];
            split(point, allPoints);
            const expectedPoint = { hub: point.hub, connections: [point_desired.hub, c1, c2,] };
            expect(point).toEqual(expectedPoint);
        });
        it("should never remove it's original connections during optimization", () => {
            // This is because those are the actual walls
            const point = {
                hub: { x: 1, y: 1 },
                // New connections
                // connections: [{ x: 0, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 4 }]
                // Original connections:
                connections: [{ x: 2, y: 1 }, { x: 1, y: 2 }]
            }
            const allPoints = [
                {
                    hub: { x: 0, y: 0 },
                    connections: [],
                },
                {
                    hub: { x: 2, y: 0 },
                    connections: [],
                },
                {
                    hub: { x: 2, y: 2 },
                    connections: [],
                },
                {
                    hub: { x: 0, y: 2 },
                    connections: [],
                },
                point
            ];
            // Split will make connections with 0,0 and 0,2; but one of these should
            // be optimized out; however, the orignal points should stay
            split(point, allPoints);
            expect(point.connections).toEqual([{ x: 0, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 2 }]);
        });
        it("should not create new connections that intersect with another point's connections", () => {
            const hub = { x: 0, y: 0 };
            const c1 = { x: 1, y: 0 };
            const c2 = { x: 0, y: 1 };
            const c3 = { x: 1, y: -1 };
            const point: Point = { hub, connections: [c1, c2, c3] };
            const point2 = { hub: { x: -1, y: 0 }, connections: [] };
            const blocking1: Vec2 = { x: -0.5, y: -0.5 };
            const blocking2: Vec2 = { x: -0.5, y: 0.5 };
            const allPoints: Point[] = [
                point,
                { hub: blocking1, connections: [blocking2] },
                { hub: blocking2, connections: [blocking1] },
                // For this test the blocking points are designed to block access to point2
                point2,
            ];
            split(point, allPoints);
            const expectedPoint = { hub: point.hub, connections: [c3, c1, c2, blocking2] };
            expect(point).toEqual(expectedPoint);

        });
        it("should fail gracefully if there are not enclosing points to connect to", () => {
            const hub = { x: 0, y: 0 };
            const c1 = { x: 1, y: 0 };
            const c2 = { x: 0, y: 1 };
            const point: Point = { hub, connections: [c1, c2] };
            const allPoints: Point[] = [
                point,
            ];
            split(point, allPoints);
            const expectedPoint = { hub: point.hub, connections: [c1, c2] };
            expect(point).toEqual(expectedPoint);
            // TODO: how will a non-split point affect mesh generation? Will it cause it to break?
        });

    });
    describe("lineSegmentsToPoints", () => {
        it('should sort connections by angle from hub', () => {
            const p_a: Vec2 = { x: 0, y: 0 };
            const p_b: Vec2 = { x: 1, y: 0 };
            const p_c: Vec2 = { x: -1, y: 0 };
            const p_d: Vec2 = { x: 0, y: 1 };
            const l1 = { p1: p_a, p2: p_b };
            const l2 = { p1: p_a, p2: p_c };
            const l3 = { p1: p_a, p2: p_d };
            const lineSegments: LineSegment[] = [
                l1, l2, l3
            ];
            const actual = lineSegmentsToPoints(lineSegments)[0];
            const expected: Point = {
                hub: p_a,
                connections: [
                    // Note: They are sorted by angle
                    p_b,
                    p_d,
                    p_c,
                ]
            };
            expect(actual).toEqual(expected);

        });
        it('should convert lineSegment[] into Point[] based on which Vec2s share identical loctions', () => {
            const p_a: Vec2 = { x: 0, y: 0 };
            const p_b: Vec2 = { x: 1, y: 0 };
            const p_c: Vec2 = { x: -1, y: 0 };
            const p_d: Vec2 = { x: 0, y: 1 };
            const p_o_a: Vec2 = { x: 10, y: 10 };
            const p_o_b: Vec2 = { x: 10, y: 11 };
            const l1 = { p1: p_a, p2: p_b };
            const l2 = { p1: p_a, p2: p_c };
            const l3 = { p1: p_a, p2: p_d };
            // This point is not touching the others
            const outsider = { p1: p_o_a, p2: p_o_b };
            const lineSegments: LineSegment[] = [
                l1, l2, l3, outsider
            ];
            const actual = lineSegmentsToPoints(lineSegments);
            const expected: Point[] = [
                {
                    hub: p_a,
                    connections: [
                        p_b,
                        p_d,
                        p_c,
                    ]
                },
                {
                    hub: p_b,
                    connections: [p_a,]
                },
                {
                    hub: p_c,
                    connections: [p_a,]
                },
                {
                    hub: p_d,
                    connections: [p_a,]
                },
                {
                    hub: p_o_a,
                    connections: [p_o_b]
                },
                {
                    hub: p_o_b,
                    connections: [p_o_a]
                },

            ];
            expect(actual).toEqual(expected);

        });
    });
});