import type { Vec2 } from "./Vec";
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
function getLoopableIndex(index: number, array: any[]) {
    let adjusted = index % array.length;
    if (adjusted < 0) {
        adjusted = array.length + adjusted;
    }
    return adjusted;
}
export function* makePolygonIndexIterator(polygon: Polygon, startIndex: number = 0): Generator<number, undefined> {

    if (polygon.inverted) {
        // Note: This unusual for loop is intentional, see the tests
        // If invereted, it will iterate the polygon in reverse order
        // STARTING with the point at start index
        for (let i = startIndex + polygon.points.length; i > startIndex; i--) {
            yield getLoopableIndex(i, polygon.points);

        }
    } else {
        for (let i = startIndex; i < startIndex + polygon.points.length; i++) {
            yield getLoopableIndex(i, polygon.points);

        }
    }
    return
}
function getPointsFromPolygonStartingAt(polygon: Polygon, startPoint: Vec2): Vec2[] {
    const startPointIndex = polygon.points.findIndex(p => vectorMath.equal(p, startPoint))
    if (startPointIndex == -1) {
        // startPoint is not on polygon
        return []
    } else {
        return Array.from(makePolygonIndexIterator(polygon, startPointIndex)).map(i => polygon.points[i])
    }
}

// A line segment that contains a reference to the polygon that it belongs to
export interface PolygonLineSegment {
    p1: Vec2;
    p2: Vec2;
    // The polygon that these points belong to
    polygon: Polygon;

}
// Given an array of PolygonLineSegment[], of all the intersections between line and the walls,
// find the closest intersection to line.p1
function getClosestIntersectionWithWalls(line: PolygonLineSegment, walls: PolygonLineSegment[]): { intersectingWall?: PolygonLineSegment, closestIntersection?: Vec2 } {
    let intersectingWall;
    let closestIntersection;
    let closestIntersectionDistance;
    // Check for collisions between the last line in the path and pathing walls
    for (let wall of walls) {
        if (wall.polygon == line.polygon) {
            // Don't collide with self
            continue;
        }
        const intersection = lineSegmentIntersection(line, wall);
        if (intersection) {
            if (vectorMath.equal(intersection, line.p1)) {
                // Exclude collisions at start point of line segment. 
                continue;
            }
            const dist = distance(line.p1, intersection);
            // If there is no closest intersection, make this intersection the closest intersection
            // If there is and this intersection is closer, make it the closest
            if (!closestIntersection || (closestIntersection && closestIntersectionDistance && closestIntersectionDistance > dist)) {
                closestIntersection = intersection;
                closestIntersectionDistance = dist;
                intersectingWall = wall
            }

        }
    }
    // Debug: print
    if (intersectingWall) {
        console.log('found intersection for line', line, closestIntersection);
    }
    return { intersectingWall, closestIntersection };
}

// Note: p2 is always the "next" point in terms of the index being greater than
// the index of p1
export function polygonToPolygonLineSegments(polygon: Polygon): PolygonLineSegment[] {
    let lastPoint = polygon.points[0];
    let lineSegments: PolygonLineSegment[] = [];
    for (let i = 1; i < polygon.points.length; i++) {
        lineSegments.push({ p1: lastPoint, p2: polygon.points[i], polygon });
        lastPoint = polygon.points[i];
    }
    // Add line from last point to first point:
    lineSegments.push({ p1: lastPoint, p2: polygon.points[0], polygon });
    return lineSegments;
}
// Expand polygon: Grows a polygon into it's "outside" by the distance of magnitude
// along the normal vectors of each vertex.
// Pure: returns a new polygon without mutating the old
export function expandPolygon(polygon: Polygon, magnitude: number): Polygon {
    return {
        points: polygon.points.map((_p, i) => projectPointAlongNormalVector(polygon, i, magnitude)),
        inverted: polygon.inverted
    }
}

function projectPointAlongNormalVector(polygon: Polygon, pointIndex: number, magnitude: number): Vec2 {
    const point = polygon.points[pointIndex];
    const nextPoint = polygon.points[getLoopableIndex(pointIndex + (polygon.inverted ? -1 : 1), polygon.points)];
    const prevPoint = polygon.points[getLoopableIndex(pointIndex + (polygon.inverted ? 1 : -1), polygon.points)];
    // Find a point along the normal:
    const projectToPoint = { x: point.x, y: point.y };
    const dxPrev = point.x - prevPoint.x;
    const dyPrev = point.y - prevPoint.y;
    projectToPoint.x -= dxPrev;
    projectToPoint.y -= dyPrev;
    const dxNext = point.x - nextPoint.x;
    const dyNext = point.y - nextPoint.y;
    projectToPoint.x -= dxNext;
    projectToPoint.y -= dyNext;

    // Find the point magnitude away from vertex along the normal
    const X = projectToPoint.x - point.x;
    const Y = projectToPoint.y - point.y;
    const D = distance(projectToPoint, point);
    const d = polygon.inverted ? -magnitude : magnitude;
    const relativeAdjustedPoint = similarTriangles(X, Y, D, d);
    // Round to the nearest whole number to avoid floating point inequalities later
    // when processing these points
    return vectorMath.round(vectorMath.subtract(point, relativeAdjustedPoint));
}

// TODO account for points that exist exactly on the line of another polygon
function isVec2InsidePolygon(point: Vec2, polygon: Polygon): boolean {
    // From geeksforgeeks.com: 
    // 1) Draw a horizontal line to the right of each point and extend it to infinity 
    // 2) Count the number of times the line intersects with polygon edges. 
    // 3) A point is inside the polygon if either count of intersections is odd or point lies on an edge of polygon. 
    // If none of the conditions is true, then point lies outside
    const testLine: LineSegment = { p1: point, p2: { x: Number.MAX_SAFE_INTEGER, y: point.y } };
    const intersections: Vec2[] = [];
    for (let polygonLineSegment of polygonToPolygonLineSegments(polygon)) {
        const intersection = lineSegmentIntersection(testLine, polygonLineSegment)
        if (intersection) {
            // Exclude intersections that have already been found
            // This can happen if the "point" shares the same "y" value as
            // a vertex in the polygon because the vertex belongs to 2 of the 
            // VertexLineSegments
            if (!intersections.find(i => vectorMath.equal(i, intersection))) {
                intersections.push(intersection);
            }
        }
    }
    const isInside = intersections.length % 2 != 0;
    // If the poly is inverted, return the opposite because
    // inverted poly's have their inside and outside flipped
    return polygon.inverted ? !isInside : isInside;

}
function findFirstPointNotInsideAnotherPoly(polygon: Polygon, polygons: Polygon[]): Vec2 | undefined {
    check_points:
    for (let point of polygon.points) {
        for (let otherPolygon of polygons) {
            if (otherPolygon == polygon) {
                // don't test self
                continue;
            }
            // If the point is inside the polygon, the entire point isn't a 
            // candidate.  Continue checking other points
            if (isVec2InsidePolygon(point, otherPolygon)) {
                continue check_points;
            }
        }
        return point;
    }
}
// The rule: inside points get removed, intersections become new points
export function mergeOverlappingPolygons(polygons: Polygon[]): Polygon[] {
    let limit = 0;
    const resultPolys: Polygon[] = [];
    // Convert all polygons into polygon line segments for processing:
    const polygonLineSegments = polygons.map(polygonToPolygonLineSegments).flat();
    // excludedPoly is used to ensure that polys are not processed more than once
    // especially because they may be processed in an inner loop.  newPolys added to
    // resultPolys do not need to be processed because as they are created they are
    // merged with ALL other polys that they are in contact with
    const excludePoly = new Set();
    // Step 1. Loop through all polys to see if they need to merge
    for (let polygon of polygons) {
        console.log('start with poly', polygon);
        if (excludePoly.has(polygon)) {
            continue;
        }
        // Now that this poly has begun processing, mark it as excluded so it won't be processed again
        excludePoly.add(polygon);

        // Step 2. Start with the first point on this polygon that is NOT inside
        // ANY other polygons.
        let firstPoint = findFirstPointNotInsideAnotherPoly(polygon, polygons);
        if (!firstPoint) {
            // If there are no points outside of all other polys because 
            // a polygon is ENTIRELY inside of other polygons, do not process it.
            // it can be fully omitted
            continue;
        }

        // Step 3. Iterate the original polygon starting at first point
        // and add the points that are being iterated to a new polygon which
        // will eventually be added to resultPolys
        const newPoly: Polygon = { points: [], inverted: false };
        const originalPolyPoints = getPointsFromPolygonStartingAt(polygon, firstPoint);
        const iterateQueue: { iteratingPolygon: Polygon, points: Vec2[] }[] = [{ iteratingPolygon: polygon, points: originalPolyPoints }];
        for (let { points, iteratingPolygon } of iterateQueue) {
            for (let index = 0; index < points.length; index++) {
                const point = points[index];
                // if point is already in newPoly, the polygon is now closed, exit the loop successfully
                if (newPoly.points.find(p => vectorMath.equal(p, point))) {
                    console.log('exit successfully,  due to point in newpoly already', point);
                    break;
                }
                console.log('new point', point);
                newPoly.points.push(point)
                const { intersectingWall, closestIntersection } = getClosestIntersectionWithWalls({ p1: point, p2: points[getLoopableIndex(index + 1, points)], polygon: iteratingPolygon }, polygonLineSegments);
                // Step 4. When we detect an intersection we branch into off into iterating
                // the intersecting polygon, still adding the points to the new polygon.  Every time
                // we find an intersection we change which polygon we're iterating.  
                if (intersectingWall && closestIntersection) {
                    // Now that we're beginning to loop the other poly, don't loop it again
                    console.log('-------------branch at', closestIntersection, 'to poly', intersectingWall.polygon);
                    excludePoly.add(intersectingWall.polygon);
                    // console.log('new intersection', closestIntersection);
                    // newPoly.points.push(closestIntersection)
                    // LEFT OFF: TODO: test for intersection between intersection and next point (this is needed for double intersections on the same wall
                    // const otherPolyIteratable = makePolygonIndexIterator(intersectingWall.polygon, intersectingWall.polygon.points.findIndex(p => p == intersectingWall.p2));

                    // Use "next" point when iterating the other poly clockwise
                    let otherPolyStartPoint = intersectingWall.p2;
                    if (intersectingWall.polygon.inverted) {
                        // Switch newPoly to inverted
                        newPoly.inverted = true;
                        // but if the other poly is inverted, use the "prev" point (for iterating counter clockwise)
                        otherPolyStartPoint = intersectingWall.p1;

                    }
                    const otherPolyPoints = getPointsFromPolygonStartingAt(intersectingWall.polygon, otherPolyStartPoint);
                    limit++;
                    if (limit > 12) {
                        console.log('exit due to infinite loop');
                        return [];
                    }
                    const nextPoints = otherPolyPoints;
                    // So long as the intersecting point isn't exactly the same as the otherPolygon's first point,
                    // add it to the nextPoints array so it will be added into the new polygon
                    if (!vectorMath.equal(nextPoints[0], closestIntersection)) {
                        nextPoints.unshift(closestIntersection);
                    }
                    iterateQueue.push({ iteratingPolygon: intersectingWall.polygon, points: nextPoints });
                    break;
                }

            }

        }
        // When either an iterator completes or exits early due to completing the polygon,
        // add the finished newPoly to the resultPolys
        // so long as it is a poly with points in it
        if (newPoly.points.length) {
            // Since inverted poly's still store their points clockwise, and just have the inverted flag set to true,
            // the newPoly's points must be reset to clockwise order since they will have been iterated counter clockwise.
            // Potential future refactor: somehow ensure that the inverted flag is tied directly to the order of the points
            if (newPoly.inverted) {
                newPoly.points = newPoly.points.reverse();
            }
            resultPolys.push(newPoly);
        }

        // TODO, protect against unusual infinite loops

    }
    return resultPolys;
}
export const testables = {
    getLoopableIndex,
    isVec2InsidePolygon,
    findFirstPointNotInsideAnotherPoly
}