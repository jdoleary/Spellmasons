import { polygonToVec2s, vec2sToPolygon } from "../PathfindingAttempt2";
import type { Vec2 } from "../commonTypes";
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