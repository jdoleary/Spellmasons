import type { LineSegment } from '../collision/collisionMath';
import type { Vec2 } from '../commonTypes';
import { generateConvexPolygonMesh, findPath, testables, Point } from '../Pathfinding';
const { split, lineSegmentsToPoints, getAngleBetweenVec2s } = testables;

describe("Pathfinding", () => {
    describe("generateConvexPolygonMesh", () => { });
    describe("findPath", () => {
        describe("given a pathing mesh", () => {
            it('should return Vec2[] of a path that, when followed, leads from the "from" Vec2 to the "to" Vec2', () => { });
        });
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
    describe("split", () => {
        it("should take a Point and add connections to other points until none of the angles between the point.hub and its connections are > 180 degress", () => {
            const hub = { x: 0, y: 0 };
            const c1 = { x: 1, y: 0 };
            const c2 = { x: 0, y: 1 };
            const point: Point = { hub, connections: [c1, c2] };
            const point2 = { hub: { x: -1, y: -1 }, connections: [] };
            const point3 = { hub: { x: -1, y: 0 }, connections: [] };
            const allPoints: Point[] = [
                point,
                point2,
                point3
            ];
            split(point, allPoints);
            const mutatedPoint = { hub: point.hub, connections: [c1, c2, point2.hub, point3.hub] };
            expect(point).toEqual(mutatedPoint);
        });
        it("should not create new connections that intersect with another point's connections", () => {
            const hub = { x: 0, y: 0 };
            const c1 = { x: 1, y: 0 };
            const c2 = { x: 0, y: 1 };
            const point: Point = { hub, connections: [c1, c2] };
            const point2 = { hub: { x: -1, y: -1 }, connections: [] };
            const point3 = { hub: { x: -1, y: 0 }, connections: [] };
            const blocking1: Vec2 = { x: -0.5, y: -0.5 };
            const blocking2: Vec2 = { x: -0.5, y: 0.5 };
            const allPoints: Point[] = [
                point,
                { hub: blocking1, connections: [blocking2] },
                { hub: blocking2, connections: [blocking1] },
                // For this test the blocking points are designed to block access to point2
                point2,
                point3
            ];
            split(point, allPoints);
            const mutatedPoint = { hub: point.hub, connections: [c1, c2, blocking1, blocking2, point3.hub] };
            expect(point).toEqual(mutatedPoint);

        });
        it("should fail gracefully if there are not enclosing points to connect to", () => { });

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