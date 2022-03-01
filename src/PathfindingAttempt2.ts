import type { LineSegment } from "./collision/collisionMath";
import type { Vec2, Polygon, Vertex } from "./commonTypes";

export function vec2sToPolygon(points: Vec2[]): Polygon {
    let startVertex;
    let lastVertex;
    for (let point of points) {
        const thisVertex: any = { ...point };
        if (!startVertex) {
            startVertex = thisVertex;
        }
        if (lastVertex) {
            thisVertex.prev = lastVertex;
            lastVertex.next = thisVertex;
        }
        lastVertex = thisVertex;
    }
    lastVertex.next = startVertex;
    startVertex.prev = lastVertex;
    const polygon: Polygon = { startVertex };

    return polygon;
}

export function polygonToVec2s(polygon: Polygon): Vec2[] {
    let currentVertex = polygon.startVertex;
    let points = [];
    let i = 0;
    do {
        points.push({ x: currentVertex.x, y: currentVertex.y });
        currentVertex = currentVertex.next;
        i++;
        // Arbitrary stop to prevent infinite loop
        if (i > 1000) {
            console.error("Prevent infinite loop when running polygonToVec2s")
            break;
        }
    } while (polygon.startVertex != currentVertex);
    return points;
}