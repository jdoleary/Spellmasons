import type { Vec2 } from "./Vec";
import * as Vec from './Vec';
import { distance, similarTriangles } from "./math";
import { isCollinearAndOverlapping, isCollinearAndPointInSameDirection, LineSegment, lineSegmentIntersection } from "./collision/collisionMath";
import { clockwiseAngle } from "./Angle";

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
    const startPointIndex = polygon.points.findIndex(p => Vec.equal(p, startPoint))
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
// find the closest intersections to line.p1 that branches off at the smallest angle
// If there are multiple intersections on a straight line, return the farthest.
// It may return more than 1 intersections if there are multiple intersections at exactly the same point

// Possible rule: Of all the intersections with a relative angle from "line" less than 180, return the closest
export interface Branch {
    // in rads
    branchAngle: number;
    distance: number;
    nextLine: PolygonLineSegment;
}
function growOverlappingCollinearLinesInDirectionOfP2(line: LineSegment, walls: LineSegment[]): LineSegment {
    // Grow test line from line.p1 to the farthest colinear, touching line's p2
    let testLineGrew = false;
    let relevantWalls = walls.filter(w => isCollinearAndPointInSameDirection(line, w));
    const originalNumberOfPotentialGrowthLoops = relevantWalls.length;
    for (let i = 0; i < originalNumberOfPotentialGrowthLoops; i++) {
        testLineGrew = false;
        for (let wall of relevantWalls) {
            if (isCollinearAndOverlapping(line, wall) && distance(line.p1, line.p2) < distance(line.p1, wall.p2)) {
                testLineGrew = true;
                // Remove the wall that was used for growing
                relevantWalls = relevantWalls.filter(x => x !== wall);

                line.p2 = wall.p2;
                break;
            }
        }
        if (!testLineGrew) {
            break;

        }

    }
    return line;

}
function getClosestBranch(line: LineSegment, walls: PolygonLineSegment[]): Branch {
    line = growOverlappingCollinearLinesInDirectionOfP2(line, walls);

    let branches: Branch[] = [];
    // Check for collisions between the last line in the path and pathing walls
    for (let wall of walls) {
        const intersection = lineSegmentIntersection(line, wall);
        if (intersection) {
            const dist = distance(line.p1, intersection);
            // don't consider lines that intersect with p1
            if (dist == 0) {
                continue;
            }
            // relative angle:
            const lastLineAngle = Vec.getAngleBetweenVec2s(intersection, line.p1);
            // Use "next" point when iterating the other poly clockwise
            let otherPolyStartPoint = wall.p2;
            if (wall.polygon.inverted) {
                // but if the other poly is inverted, use the "prev" point (for iterating counter clockwise)
                otherPolyStartPoint = wall.p1;
            }
            const otherPolyNextPoints = getPointsFromPolygonStartingAt(wall.polygon, otherPolyStartPoint);
            // If the intersection is the first vertex then the next point is the second vertex
            // but if the intersection is just an intersection along the line, then the next point is the first vertex
            const nextPoint = Vec.equal(otherPolyNextPoints[0], intersection) ? otherPolyNextPoints[1] : otherPolyNextPoints[0];
            const nextLineAngle = Vec.getAngleBetweenVec2s(intersection, nextPoint);
            const branchAngle = clockwiseAngle(lastLineAngle, nextLineAngle);
            branches.push({
                branchAngle,
                distance: dist,
                nextLine: { p1: intersection, p2: nextPoint, polygon: wall.polygon },
            });
        }
    }
    // Sort branches by distance (then by angle)
    branches = branches.sort((a, b) => {
        const diffDistance = a.distance - b.distance
        // If distance is identical sort by smallest angle
        if (diffDistance === 0) {
            return a.branchAngle - b.branchAngle;
        } else {
            return diffDistance;
        }

    });
    // Find the closest branch with a branchAngle < 180 because a branch angle of > 180 degrees
    // (if it's not the last branch means that it branches off INSIDE of another branch
    // if there are none, find the furthest with a branchAngle of 180 exactly (this is the farthest point
    // along a straight line)


    // Return the closest branch with an angle < 180 degrees
    for (let branch of branches) {
        if (branch.branchAngle < Math.PI) {
            return branch;
        }
    }
    // If there are no branches with an angle < 180 degrees, then take farthest branch with the smallest angle
    // which is the branch at the end of the test line with the smallest angle
    return branches.sort((a, b) => {
        // Sort farthest first
        const diffDistance = b.distance - a.distance
        // If distance is identical sort by smallest angle
        if (diffDistance === 0) {
            return a.branchAngle - b.branchAngle;
        } else {
            return diffDistance;
        }
    })[0];
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

// Returns a normal vector of a line segment, assuming
// that the p1 is the previous point and p2 is the next point (this
// is relevant when dealing with polygons)
// Note: Gamespace is upsidedown but I think in regular cartesian coordinate
// plane where y is up and in that mindset, polygons are expressed clockwise.
function getNormalVectorOfLineSegment(lineSegment: LineSegment): Vec2 {
    // Note: This is in the context of polygons, so p1 is the first point ("prev")
    // and p2 is the "next" point.  So the normal vector will point OUTSIDE
    // the polygon so long as the polygon isn't inverted
    return {
        x: lineSegment.p1.y - lineSegment.p2.y,
        y: lineSegment.p1.x - lineSegment.p2.x
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
    return Vec.round(Vec.subtract(point, relativeAdjustedPoint));
}

// Note: There is a slight flaw in this algorithm in that if the point lies
// directly on a line of the poly on the left side, it will yield a false negative
function isVec2InsidePolygon(point: Vec2, polygon: Polygon): boolean {
    // From geeksforgeeks.com: 
    // 1) Draw a horizontal line to the right of each point and extend it to infinity 
    // 2) Count the number of times the line intersects with polygon edges. 
    // 3) A point is inside the polygon if either count of intersections is odd or point lies on an edge of polygon. 
    // If none of the conditions is true, then point lies outside
    // Note: we must test both a horizontal line and a vertical line in order to
    // account for corner cases such as the horizontal line intersecting directly with a vertex of a 
    // poly (which would be 1 intersection, but the point could still be outside);
    // Corner cases include when the test line intersects directly with a vertex or perfectly with an
    // edge.  Intersecting with multiple points on the same edge should be reduced to 1 intersection
    // We do two lines to account for the corner case of intersecting directly with a vertex.

    const horizontalLine: LineSegment = { p1: point, p2: { x: Number.MAX_SAFE_INTEGER, y: point.y } };
    // Start outside, so each odd number of flips will determine it to be inside
    let isInside = false;
    const intersections: Vec2[] = [];
    for (let wall of polygonToPolygonLineSegments(polygon)) {
        const intersection = lineSegmentIntersection(horizontalLine, wall)

        //  Don't process the same intersection more than once
        if (intersection && !intersections.find(i => Vec.equal(i, intersection))) {
            intersections.push(intersection);
            // If the intersection is at a vertex of the polygon, this is a special case and must be handled by checking the
            // angles of what happens when the line goes through the intersection
            // This logic solves these corner cases:
            // 1. point is same location as a vertex of the polygon (inside)
            // 2. point is horizontal to a vertex of the polygon (possibly inside or outside)
            // 3. point is colinear with, but not on, a horizontal edge of the polygon (possibly inside or outside)
            if (Vec.equal(intersection, wall.p1) || Vec.equal(intersection, wall.p2)) {
                // Get the INSIDE angle of the vertex (relative to it's polygon)
                const indexOfVertex = polygon.points.findIndex(p => Vec.equal(p, intersection));
                const startClockwiseAngle = Vec.getAngleBetweenVec2s(intersection, polygon.points[getLoopableIndex(indexOfVertex + 1, polygon.points)]);
                const endClockwiseAngle = Vec.getAngleBetweenVec2s(intersection, polygon.points[getLoopableIndex(indexOfVertex - 1, polygon.points)]);
                // Take the vectors: line.p1 (the point) to vertex/intersection and vertex/intersection to line.p2
                const v1Angle = Vec.getAngleBetweenVec2s(intersection, horizontalLine.p1);
                const v2Angle = Vec.getAngleBetweenVec2s(intersection, horizontalLine.p2);
                const allowableAngle = clockwiseAngle(startClockwiseAngle, endClockwiseAngle);
                const v1AngleInside = Vec.equal(intersection, point) || clockwiseAngle(startClockwiseAngle, v1Angle) <= allowableAngle;
                const v2AngleInside = clockwiseAngle(startClockwiseAngle, v2Angle) <= allowableAngle;
                // Only flip if v1AngleInside XOR v2AngleInside
                if (v1AngleInside !== v2AngleInside) {
                    isInside = !isInside;
                }
            } else if (Vec.equal(intersection, point)) {
                // The point itself is an intersection point, meaning the point lies directly on one of the walls of the polygon
                if (!polygon.inverted) {
                    // then it obviously is inside of the polygon (this implementation includes ON the walls as inside)
                    return true
                } else {
                    // Note: Inverted poly always flips the result
                    return false
                }
            } else {
                // If it intersects with a wall, flip the bool
                isInside = !isInside
            }
        }
    }
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
// How merging overlapping polygons works:
// For every polygon that hasn't already been processed,
// Find the first point that is not inside any other polygons to start processing from
// Make a line segment from that "current" point to the "next" point and test for intersection
// with all polygonLineSegments (including ones from the same polygon) so long as the intersection
// isn't the "current" point.  This both allows the complete iteration of a solo polygon
// AND supports properly branching to new polygons that intersect the currentlyIteratingPolygon
// Onces intersections (possibly multiple) are discovered, find the intersection with the lineSegment
// that has the smallest clockwise angle from the (current, next) line that we last came from).
// When found, set the intersection to "current" and that lineSegment's "next" point to next and start
// the process over.  When an intersection is equal to the original current point, the polygon is complete.
export function mergeOverlappingPolygons(polygons: Polygon[]): Polygon[] {
    // Convert all polygons into polygon line segments for processing:
    const polygonLineSegments = polygons.map(polygonToPolygonLineSegments).flat();

    // Remove all polygons that have NO points outside of all other polygons
    // Note: it is critical that polygonLineSegments recieves it's value BEFORE
    // any polygons are removed because even polygons that shouldn't be processed
    // as origin polys (because each of their verticies are inside other polys)
    // may still have edges (walls) that should be considered. To understand this
    // situation imagine one box with two horizontal rectangles, one rec covering its
    // top two verts and the other covering the bottom two.  This box shouldn't be
    // processed but it's walls should still be considered as it will ensure that
    // all 3 are merged.

    // let flagForRemoval: Polygon[] = [];
    // for (let polygon of polygons) {
    //     let firstPoint = findFirstPointNotInsideAnotherPoly(polygon, polygons.filter(p => !flagForRemoval.includes(p)));
    //     if (!firstPoint) {
    //         flagForRemoval.push(polygon);
    //     }
    // }
    // polygons = polygons.filter(p => {
    //     return !flagForRemoval.includes(p);
    // });

    // resultPolys stores the merged polygons:
    const resultPolys: Polygon[] = [];
    // Polygons that failed to process
    const badPolys: Polygon[] = [];


    // excludedPoly is used to ensure that polys are not processed more than once
    // especially because they may be processed in an inner loop.  newPolys added to
    // resultPolys do not need to be processed because as they are created they are
    // merged with ALL other polys that they are in contact with
    const excludePoly: Set<Polygon> = new Set();

    function processPolygon(processingPolygon: Polygon): boolean {
        if (excludePoly.has(processingPolygon)) {
            // Polygon is excluded from processing because it has already been processed
            return true;
        }

        // Step 2. Start with the first point on this polygon that is NOT inside
        // ANY other polygons.
        // Note: only consider polygons that have yet to be processed because since a processed polygon
        // will absorb ALL touching polygons, the next polygon to be processed can't be touching / inside
        // an already processed polygon.  This filter also allows identical polygons to be processed
        // because without it, none of them would have any points outside of all other polygons.
        let firstPoint = findFirstPointNotInsideAnotherPoly(processingPolygon, polygons);
        if (!firstPoint) {
            // If there are no points outside of all other polys because 
            // a polygon is ENTIRELY inside of other polygons, do not process it.
            // it can be fully omitted
            return true;
        }

        const originalPolyPoints = getPointsFromPolygonStartingAt(processingPolygon, firstPoint);
        if (originalPolyPoints.length < 2) {
            // Polygon cannot be processed because we can't find it's array of points starting from firstPoint
            badPolys.push(processingPolygon);
            return false;
        }
        // p1 represents the last intersection, and p2 is where it INTENDS to go to next
        let currentLine: PolygonLineSegment = { p1: originalPolyPoints[0], p2: originalPolyPoints[1], polygon: processingPolygon };
        const newPoly: Polygon = { points: [], inverted: false };
        // The first point to iterate is also the firstPoint of the new poly
        newPoly.points.push(originalPolyPoints[0]);
        // TODO update loop limit to something not just for testing
        const loopLimit = 100
        // TODO handle bad polys in a more sustainable way
        let i = 0;
        do {
            if (++i > loopLimit) {
                console.log('infinite loop');
                throw new Error("infinite loop");
                return false;

            }
            // This poly is processing, mark it as excluded so it won't start processing from the beginning
            excludePoly.add(currentLine.polygon);
            const branch = getClosestBranch(currentLine, polygonLineSegments);
            currentLine = branch.nextLine;
            // Closes when the point about to be added is the same as the first point
            if (Vec.equal(currentLine.p1, firstPoint)) {
                // The poly is successfully closed and done processing
                break;
            }
            newPoly.points.push(currentLine.p1);
            // If the intersecting poly is inverted, the new poly must become inverted.
            // Any poly that merged with an inverted poly becomes an inverted poly
            if (branch.nextLine.polygon.inverted) {
                // Switch newPoly to inverted
                newPoly.inverted = true;
            }

        } while (true);

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
        return true;
    }
    // Loop through all polys to see if they need to merge
    for (let startProcessingPolygon of polygons) {
        const isBadPolygon = processPolygon(startProcessingPolygon);
        // TODO: how to handle if a polygon failed to process
    }
    return resultPolys;
}
export const testables = {
    getLoopableIndex,
    isVec2InsidePolygon,
    findFirstPointNotInsideAnotherPoly,
    getNormalVectorOfLineSegment,
    getClosestBranch,
    growOverlappingCollinearLinesInDirectionOfP2
}