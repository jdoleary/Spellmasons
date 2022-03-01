import { polygonToVec2s, vec2sToPolygon, testables } from "../PathfindingAttempt2";
const { projectVertexAlongOutsideNormal, insetPolygon, getAngleBetweenAngles } = testables;
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

describe('insetPolygon', () => {
    it('should return a new polygon with all of its points grown by magnitude', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 1 }
        const p3 = { x: 1, y: 1 }
        const p4 = { x: 1, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygon = vec2sToPolygon(points);

        const newPolygon = insetPolygon(polygon, Math.sqrt(2));
        const newPoints = polygonToVec2s(newPolygon);
        expect(newPoints).toEqual([
            { x: -1, y: -1 },
            { x: -1, y: 2 },
            { x: 2, y: 2 },
            { x: 2, y: -1 },
        ]);
    });
    it('should inset in the opposite direction for inverted polygons where the inside and outside are flipped', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 2 }
        const p3 = { x: 2, y: 2 }
        const p4 = { x: 2, y: 0 }
        // Note: The points are reversed which means the polygon is inverted
        const points: Vec2[] = [p1, p2, p3, p4].reverse();
        const polygon = vec2sToPolygon(points);

        const newPolygon = insetPolygon(polygon, Math.sqrt(2));
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