import { pointsToPolygon } from "../PathfindingAttempt2";
import type { Vec2 } from "../commonTypes";
describe('pointsToPolygon', () => {
    it('should create a polygon from the points', () => {
        const p1 = { x: -1, y: 0 }
        const p2 = { x: 1, y: 1 }
        const p3 = { x: 1, y: 0 }
        const points: Vec2[] = [p1, p2, p3];
        const polygon = pointsToPolygon(points);
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