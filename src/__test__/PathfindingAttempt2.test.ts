import { polygonToVec2s, vec2sToPolygon, testables } from "../PathfindingAttempt2";
const { projectVertexAlongOutsideNormal, expandPolygon, getAngleBetweenAngles, mergeOverlappingPolygons } = testables;
import type { Vec2 } from "../commonTypes";
describe('projectVertexAlongOutsideNormal', () => {
    it('should find the point "magnitude" distance away from p2 along the normal', () => {
        // These points represent a corner, where the inside is down and to the right
        // and the outside is up and to the left
        // assuming a coordinate plane where right, up is x positive, y positive
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 1 }
        const p3 = { x: 1, y: 1 }
        const points: Vec2[] = [p1, p2, p3];
        const polygon = vec2sToPolygon(points);

        // get p2 as a vertex
        const vertex = polygon.startVertex.next;
        const actual = projectVertexAlongOutsideNormal(vertex, Math.sqrt(2));
        const expected = { x: -1, y: 2 }
        expect(actual).toEqual(expected);
    });
    it('should find the point "magnitude" distance away from p2 along the normal (inverted)', () => {
        // These points represent a corner, where the inside is down and to the right
        // and the outside is up and to the left
        // assuming a coordinate plane where right, up is x positive, y positive
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 1 }
        const p3 = { x: 1, y: 1 }
        const points: Vec2[] = [p3, p2, p1];
        const polygon = vec2sToPolygon(points);

        // get p2 as a vertex
        const vertex = polygon.startVertex.next;
        const actual = projectVertexAlongOutsideNormal(vertex, Math.sqrt(2));
        const expected = { x: 1, y: 0 }
        expect(actual).toEqual(expected);
    });
});
describe('getAngleBetweenAngles', () => {
    [
        [135, 45, 90],
        [-90, 90, 180],
        [0, 90, 270],
        [90, 0, 90],
        [180, 0, 180],
        [-180, 0, 180],
    ].map(([prev, next, expected]) => {
        it(`should return ${expected} for ${prev} to ${next}`, () => {
            const degToRad = Math.PI / 180;
            const actual = getAngleBetweenAngles(prev * degToRad, next * degToRad);
            expect(actual / degToRad).toEqual(expected);
        });
    });
});

describe('expandPolygon', () => {
    it('should return a new polygon with all of its points grown by magnitude', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 1 }
        const p3 = { x: 1, y: 1 }
        const p4 = { x: 1, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygon = vec2sToPolygon(points);

        const newPolygon = expandPolygon(polygon, Math.sqrt(2));
        const newPoints = polygonToVec2s(newPolygon);
        expect(newPoints).toEqual([
            { x: -1, y: -1 },
            { x: -1, y: 2 },
            { x: 2, y: 2 },
            { x: 2, y: -1 },
        ]);
    });
    it('should expand in the opposite direction for inverted polygons where the inside and outside are flipped', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 2 }
        const p3 = { x: 2, y: 2 }
        const p4 = { x: 2, y: 0 }
        // Note: The points are reversed which means the polygon is inverted
        const points: Vec2[] = [p1, p2, p3, p4].reverse();
        const polygon = vec2sToPolygon(points);

        const newPolygon = expandPolygon(polygon, Math.sqrt(2));
        const newPoints = polygonToVec2s(newPolygon);
        expect(newPoints).toEqual([
            { x: 1, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 1 },
        ]);
    });

});
describe('vec2sToPolygon', () => {
    it('should create a polygon from the Vec2s', () => {
        const p1 = { x: -1, y: 0 }
        const p2 = { x: 1, y: 1 }
        const p3 = { x: 1, y: 0 }
        const points: Vec2[] = [p1, p2, p3];
        const polygon = vec2sToPolygon(points);
        expect(polygon.startVertex.x).toEqual(p1.x);
        expect(polygon.startVertex.y).toEqual(p1.y);

        expect(polygon.startVertex.next.x).toEqual(p2.x);
        expect(polygon.startVertex.next.y).toEqual(p2.y);

        expect(polygon.startVertex.next.next.x).toEqual(p3.x);
        expect(polygon.startVertex.next.next.y).toEqual(p3.y);

        expect(polygon.startVertex.next.next.next.x).toEqual(p1.x);
        expect(polygon.startVertex.next.next.next.y).toEqual(p1.y);

        expect(polygon.startVertex.prev.x).toEqual(p3.x);
        expect(polygon.startVertex.prev.y).toEqual(p3.y);

        expect(polygon.startVertex.prev.next.x).toEqual(p1.x);
        expect(polygon.startVertex.prev.next.y).toEqual(p1.y);
    });
});
describe('polygonToVec2s', () => {
    it('should return a Vec2[] from the points of the polygon', () => {
        const p1 = { x: -1, y: 0 }
        const p2 = { x: 1, y: 1 }
        const p3 = { x: 1, y: 0 }
        const points: Vec2[] = [p1, p2, p3];
        const polygon = vec2sToPolygon(points);
        const actual = polygonToVec2s(polygon);
        const expected = points;
        expect(actual).toEqual(expected);
    });
});

describe('mergeOverlappingPolygons', () => {
    describe('given overlapping boxes on one axis', () => {
        it("should remove the overlapping verticies and return a polygon that is one large rectangle", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA = vec2sToPolygon(points);
            const p1b = { x: 0, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 2 }
            const p4b = { x: 1, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB = vec2sToPolygon(pointsb);
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];

            const actual = polygonToVec2s(mergedPolygon);
            const expected = [
                p1,
                p2b,
                p3b,
                p4
            ];
            expect(actual).toEqual(expected);
        });
    });
    describe('given boxes that each share 1 vertex inside of the other', () => {
        it("should remove inside verticies and make a polygon that is the spacial addition of the two boxes", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 2, y: 2 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA = vec2sToPolygon(points);
            const p1b = { x: 1, y: 1 }
            const p2b = { x: 1, y: 3 }
            const p3b = { x: 3, y: 3 }
            const p4b = { x: 3, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB = vec2sToPolygon(pointsb);
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];

            const actual = polygonToVec2s(mergedPolygon);
            const expected = [
                p1,
                p2,
                { x: 1, y: 2 },
                p2b,
                p3b,
                p4b,
                { x: 2, y: 1 },
                p4
            ];
            expect(actual).toEqual(expected);

        });
    });
    describe('given boxes that are identical', () => {
        it("should remove one box entirely", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 2, y: 2 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA = vec2sToPolygon(points);
            const polygonB = vec2sToPolygon(points);
            const mergedPolygons = mergeOverlappingPolygons([polygonA, polygonB]);
            const actual = mergedPolygons.length;
            const expected = 1;
            expect(actual).toEqual(expected);
        });
    });

});