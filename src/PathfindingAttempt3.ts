import { Vec2, getAngleBetweenVec2s } from "./Vec";
import * as vectorMath from './collision/vectorMath';
import { distance, similarTriangles } from "./math";
import { LineSegment, lineSegmentIntersection } from "./collision/collisionMath";

export interface Polygon {
    points: Vec2[];
    // A polygon is inverted if it is empty on the inside and filled on the outside
    inverted: boolean;
}
// Allows accessing an array without going out of bounds.  So getBoundedIndex(array.length+1)
// will be index of 1 instead of beyond the limit of the array
function getElementAtLoopableIndex(index: number, array: any[]) {
    let adjusted = index % array.length;
    if (adjusted < 0) {
        adjusted = array.length + adjusted;
    }
    return array[adjusted];
}
export const testables = {
    getElementAtLoopableIndex
}
export function* makePolygonIterator(polygon: Polygon, startPoint?: Vec2): Generator<Vec2> {

    let startIndex = startPoint
        ? polygon.points.findIndex(p => vectorMath.equal(p, startPoint))
        // Default to index 0 if no startPoint is provided
        : 0;
    if (startIndex == -1) {
        // Then startPoint does not belong to polygon;
        return
    }
    if (polygon.inverted) {
        // Note: This unusual for loop is intentional, see the tests
        // If invereted, it will iterate the polygon in reverse order
        // STARTING with the point at start index
        for (let i = startIndex + polygon.points.length; i > startIndex; i--) {
            yield getElementAtLoopableIndex(i, polygon.points);

        }
    } else {
        for (let i = startIndex; i < startIndex + polygon.points.length; i++) {
            yield getElementAtLoopableIndex(i, polygon.points);

        }
    }
}

// A line segment that contains a reference to the polygon that it belongs to
export interface PolygonLineSegment {
    p1: Vec2;
    p2: Vec2;
    parentPolygon: Polygon;

}
// Expand polygon: Grows a polygon into it's "outside" by the distance of magnitude
// along the normal vectors of each vertex.
// Pure: returns a new polygon without mutating the old
// export function expandPolygon(polygon: Polygon, magnitude: number): Polygon {
//     return {
//         points: polygon.points.map(p => projectVertexAlongOutsideNormal()),
//         inverted: polygon.inverted
//     }
// }

// function projectPointAlongVector(point: Vec2, vector: Vec2 magnitude: number): Vec2 {
//     // Find a point along the normal:
//     const projectToPoint = { x: point.x, y: point.y };
//     const dxPrev = point.x - point.prev.x;
//     const dyPrev = point.y - point.prev.y;
//     projectToPoint.x -= dxPrev;
//     projectToPoint.y -= dyPrev;
//     const dxNext = point.x - point.next.x;
//     const dyNext = point.y - point.next.y;
//     projectToPoint.x -= dxNext;
//     projectToPoint.y -= dyNext;

//     // Find out if the angle is inverted based on the order of prev and next verticiees
//     const anglePrev = getAngleBetweenVec2s(point, point.prev);
//     const angleNext = getAngleBetweenVec2s(point, point.next);
//     const angleBetween = getAngleBetweenAngles(anglePrev, angleNext);
//     const isInverted = angleBetween <= Math.PI / 2;
//     // Find the point magnitude away from vertex along the normal
//     const X = projectToPoint.x - point.x;
//     const Y = projectToPoint.y - point.y;
//     const D = distance(projectToPoint, point);
//     const d = isInverted ? -magnitude : magnitude;
//     const relativeAdjustedPoint = similarTriangles(X, Y, D, d);
//     return vectorMath.subtract(point, relativeAdjustedPoint);
// }