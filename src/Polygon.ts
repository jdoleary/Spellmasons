import type { Vec2 } from "./Vec";
import * as Vec from './Vec';
import { distance, similarTriangles } from "./math";
import { isCollinearAndOverlapping, isCollinearAndPointInSameDirection, LineSegment, lineSegmentIntersection } from "./collision/collisionMath";
import { clockwiseAngle, isAngleBetweenAngles } from "./Angle";

export interface Polygon {
    points: Vec2[];
    // A polygon is inverted if it is empty on the inside and filled on the outside
    inverted: boolean;
}
// Allows accessing an array without going out of bounds.  So getBoundedIndex(array.length+1)
// will be index of 1 instead of beyond the limit of the array
export function getLoopableIndex(index: number, array: any[]) {
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
export function getPointsFromPolygonStartingAt(polygon: Polygon, startPoint: Vec2): Vec2[] {
    const startPointIndex = polygon.points.findIndex(p => Vec.equal(p, startPoint))
    if (startPointIndex == -1) {
        // startPoint is not on polygon;
        // Note sometimes this function is used to determine if two polygons are equivalent
        // so it is within the relm of regular usage to pass a startPoint that pay not
        // exist on polygon.points
        return []
    } else {
        const polygonIndicies = Array.from(makePolygonIndexIterator(polygon, startPointIndex))
        const vec2s = polygonIndicies.map(i => {
            if (polygon.points[i]) {
                return polygon.points[i];
            } else {
                return undefined
            }
        })
        // Typeguard
        if (vec2s.some(v => v == undefined)) {
            console.error('One or more polygonIndicies are undefined')
            return [];
        }
        return vec2s as Vec2[];
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
function getClosestBranch(line: LineSegment, walls: PolygonLineSegment[]): Branch | undefined {
    line = growOverlappingCollinearLinesInDirectionOfP2(line, walls);

    let branches: Branch[] = [];
    // Check for collisions between the last line in the path and pathing walls
    for (let wall of walls) {
        let intersection = lineSegmentIntersection(line, wall);
        if (intersection) {
            // Round the intersection since points that are of by 0.00000000001 (roughly) should be considered idential
            // (the lineSegment intersection function isn't perfect)
            intersection = Vec.round(intersection);
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
            const otherPolyFirstPoint = otherPolyNextPoints[0];
            const otherPolySecondPoint = otherPolyNextPoints[1];
            if (otherPolyFirstPoint) {
                const nextPoint = Vec.equal(otherPolyFirstPoint, intersection) ? otherPolySecondPoint : otherPolyFirstPoint;
                if (nextPoint) {
                    // If the intersection is the first vertex then the next point is the second vertex
                    // but if the intersection is just an intersection along the line, then the next point is the first vertex
                    const nextLineAngle = Vec.getAngleBetweenVec2s(intersection, nextPoint);
                    const branchAngle = clockwiseAngle(lastLineAngle, nextLineAngle);
                    branches.push({
                        branchAngle,
                        distance: dist,
                        nextLine: { p1: intersection, p2: nextPoint, polygon: wall.polygon },
                    });
                } else {
                    console.error('nextPoint is unexpectedly missing.')
                }
            } else {
                console.error('otherPolyFirstPoint is unexpectedly missing.')
            }
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
    if (!polygon.points[0]) {
        return [];
    }
    let lastPoint = polygon.points[0];
    let lineSegments: PolygonLineSegment[] = [];
    for (let i = 1; i < polygon.points.length; i++) {
        const point = polygon.points[i];
        if (point) {
            lineSegments.push({ p1: lastPoint, p2: point, polygon });
            lastPoint = point;
        } else {
            console.error('Something went wrong in the for loop of polygonToPolygonLineSements.  points[i] is undefined');
        }
    }
    // Add line from last point to first point:
    lineSegments.push({ p1: lastPoint, p2: polygon.points[0], polygon });
    return lineSegments;
}
export function polygonLineSegmentToLineSegment(polygonLineSegment: PolygonLineSegment): LineSegment {
    return { p1: polygonLineSegment.p1, p2: polygonLineSegment.p2 };
}
// Expand polygon: Grows a polygon into it's "outside" by the distance of magnitude
// along the normal vectors of each vertex.
// Pure: returns a new polygon without mutating the old
export function expandPolygon(polygon: Polygon, magnitude: number): Polygon {
    return {
        points: polygon.points.map((_p, i) => projectPointForPathingMesh(polygon, i, magnitude)),
        inverted: polygon.inverted
    }
}

function arePolygonsEquivalent(p1: Polygon, p2: Polygon): boolean {
    if (p1.inverted != p2.inverted) {
        return false;
    }
    if (p1.points.length != p2.points.length) {
        return false;
    }
    const p1StartPoint = p1.points[0];
    if (!p1StartPoint) {
        // p1 polygon has no points
        return false;
    }
    const otherPolyIterator = getPointsFromPolygonStartingAt(p2, p1StartPoint);
    const otherPolyPointsOrderedAsP1Points = Array.from(otherPolyIterator);
    if (otherPolyIterator.length == 0) {
        return false;
    }
    for (let i = 0; i < p1.points.length; i++) {
        const p = p1.points[i];
        const otherP = otherPolyPointsOrderedAsP1Points[i];
        if (p && otherP) {
            if (!Vec.equal(p, otherP)) {
                return false;
            }
        } else {
            console.error('arePolygonsEquivalent: p or otherP are undefined. This error should never happen.')
        }
    }
    return true;
}
export function doesVertexBelongToPolygon(p: Vec2, poly: Polygon): boolean {
    return !!poly.points.find(x => Vec.equal(x, p));
}

// Returns a normal vector of a line segment, assuming
// that the p1 is the previous point and p2 is the next point (this
// is relevant when dealing with polygons)
// Note: Gamespace is upsidedown but I think in regular cartesian coordinate
// plane where y is up and in that mindset, polygons are expressed clockwise.
// but in this game they are expressed counterclockwise.  I should go back
// and update this when I have time but I probably wont.
export function getNormalVectorOfLineSegment(lineSegment: LineSegment): Vec2 {
    // Note: This is in the context of polygons, so p1 is the first point ("prev")
    // and p2 is the "next" point.  So the normal vector will point OUTSIDE
    // the polygon so long as the polygon isn't inverted
    // Note: If the line segment belongs to an inverted polygon, you'll have to
    // multiply the vector by -1 to get a normal that points into "walkable" space
    return {
        x: lineSegment.p1.y - lineSegment.p2.y,
        y: lineSegment.p2.x - lineSegment.p1.x
    }
}
function projectPointForPathingMesh(polygon: Polygon, pointIndex: number, magnitude: number): Vec2 {
    const point = polygon.points[pointIndex];
    if (point) {
        const nextPoint = polygon.points[getLoopableIndex(pointIndex + (polygon.inverted ? -1 : 1), polygon.points)];
        const prevPoint = polygon.points[getLoopableIndex(pointIndex + (polygon.inverted ? 1 : -1), polygon.points)];
        if (nextPoint && prevPoint) {
            const projectToPoint = getPointNormalVector(point, prevPoint, nextPoint)
            projectToPoint.x *= magnitude;
            projectToPoint.y *= magnitude;
            // Round to the nearest whole number to avoid floating point inequalities later
            // when processing these points
            return Vec.round(Vec.add(point, projectToPoint));
        } else {
            console.error('projectPointForPathingMesh: nextPoint or prevPoint is undefined.  This error should never happen.');
            return { x: 0, y: 0 };
        }
    } else {
        console.error('projectPointForPathingMesh: point is undefined.  This error should never happen.');
        return { x: 0, y: 0 };
    }

}

function getPointNormalVector(point: Vec2, prevPoint: Vec2, nextPoint: Vec2): Vec2 {
    // Find a point along the normal:
    let projectToPoint = { x: 0, y: 0 };
    const dxPrev = point.x - prevPoint.x;
    const dyPrev = point.y - prevPoint.y;
    projectToPoint.x += dxPrev;
    projectToPoint.y += dyPrev;
    const dxNext = point.x - nextPoint.x;
    const dyNext = point.y - nextPoint.y;
    projectToPoint.x += dxNext;
    projectToPoint.y += dyNext;
    // Now this is tricky, since polygons are expressed in points from prev to point to next,
    // the normal vector of a point depends on the "direction" of traversal from prev to point to next.
    // So if the 2 lines from prev to point and from point to next make an obtuse angle, we project
    // the normal to the outside (in the direction of the obtuse angle), but if they make an acute angle
    // the normal point will be inside the acute angle.  The orientation of the prev point and the next point
    // relative to the main point is what determines wether the outside angle is the obtuse or the actue angle.
    const outsideAngle = getOutsideAngleOfPoint(prevPoint, point, nextPoint);
    if (outsideAngle <= Math.PI / 2) {
        // Invert
        projectToPoint = Vec.multiply(-1, projectToPoint);
    }

    // Normalize projectToPoint so it only carries the + or -
    if (projectToPoint.x !== 0) {
        projectToPoint.x /= Math.abs(projectToPoint.x);
    }
    if (projectToPoint.y !== 0) {
        projectToPoint.y /= Math.abs(projectToPoint.y);
    }
    return projectToPoint;


}

// In radians
// Returns the inside angle of a point from start clockwise to end
// The "inside angle" is the angle that points towards the inside ("non-walkable")
// part of the polygon
export function getInsideAnglesOfPoint(polygon: Polygon, pointIndex: number): { start: number, end: number } {
    const point = polygon.points[pointIndex];
    if (point) {
        const nextPoint = polygon.points[getLoopableIndex(pointIndex + (polygon.inverted ? -1 : 1), polygon.points)];
        const prevPoint = polygon.points[getLoopableIndex(pointIndex + (polygon.inverted ? 1 : -1), polygon.points)];
        if (nextPoint && prevPoint) {
            const angleToPrevPoint = Vec.getAngleBetweenVec2s(point, prevPoint);
            const angleToNextPoint = Vec.getAngleBetweenVec2s(point, nextPoint);
            return { start: angleToNextPoint, end: angleToPrevPoint };
        } else {
            console.error('getInsideAnglesOfPoint: nextPoint or prevPoint is undefined. This error should never happen.');
            return { start: 0, end: 0 };
        }
    } else {
        console.error('getInsideAnglesOfPoint: point is undefined. This error should never happen.');
        return { start: 0, end: 0 };
    }
}
function getOutsideAngleOfPoint(prevPoint: Vec2, point: Vec2, nextPoint: Vec2): number {
    const angleToPrevPoint = Vec.getAngleBetweenVec2s(point, prevPoint);
    const angleToNextPoint = Vec.getAngleBetweenVec2s(point, nextPoint);
    return clockwiseAngle(angleToPrevPoint, angleToNextPoint);

}
export function getInsideAnglesOfWall(p: PolygonLineSegment): { start: number, end: number } {
    const A = Vec.getAngleBetweenVec2s(p.p1, p.p2);
    if (p.polygon.inverted) {
        return { start: A - Math.PI, end: A };
    } else {
        return { start: A, end: A - Math.PI };
    }
}

// Returns true if casting a line from point (a vertex on a polygon) to a target Vec2 passes through the
// inside of point's polygon
export function doesLineFromPointToTargetProjectAwayFromOwnPolygon(polygon: Polygon, pointIndex: number, target: Vec2): boolean {
    const point = polygon.points[pointIndex];
    if (point !== undefined) {
        const { start, end } = getInsideAnglesOfPoint(polygon, pointIndex);
        const angleToTarget = Vec.getAngleBetweenVec2s(point, target);
        return !isAngleBetweenAngles(angleToTarget, start, end);
    } else {
        console.error("Invalid pointIndex");
        return false;
    }
}

// Note: There is a slight flaw in this algorithm in that if the point lies
// directly on a line of the poly on the left side, it will yield a false negative
export function isVec2InsidePolygon(point: Vec2, polygon: Polygon): boolean {
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
        const _intersection = lineSegmentIntersection(horizontalLine, wall)
        // Rounding and removing extra zeros: https://stackoverflow.com/a/12830454/4418836
        // See test
        // 'should return false for this real world example which would incur a floating point error without the current form of the function'
        // for explanation
        const intersection = _intersection ? { x: +_intersection.x.toFixed(2), y: +_intersection.y.toFixed(2) } : undefined

        //  Don't process the same intersection more than once
        if (intersection && !intersections.find(i => Vec.equal(i, intersection))) {
            intersections.push(intersection);
            // If the intersection is at a vertex of the polygon, this is a special case and must be handled by checking the
            // angles of what happens when the line goes through the intersection
            // This logic solves these corner cases:
            // 1. point is same location as a vertex of the polygon (inside)
            // 2. point is horizontal to a vertex of the polygon (possibly inside or outside)
            // 3. point is colinear with, but not on, a horizontal edge of the polygon (possibly inside or outside)
            if (Vec.equal(intersection, point)) {
                // The point itself is an intersection point, meaning the point lies directly on one of the walls of the polygon
                // then it obviously is inside of the polygon (this implementation includes ON the walls as inside)
                // Note: This is so for inverted polygons too.
                return true
            } else if (Vec.equal(intersection, wall.p1) || Vec.equal(intersection, wall.p2)) {
                // Get the INSIDE angle of the vertex (relative to it's polygon)
                const indexOfVertex = polygon.points.findIndex(p => Vec.equal(p, intersection));
                const nextPoint = polygon.points[getLoopableIndex(indexOfVertex + 1, polygon.points)];
                const prevPoint = polygon.points[getLoopableIndex(indexOfVertex - 1, polygon.points)];
                if (nextPoint && prevPoint) {

                    const startClockwiseAngle = Vec.getAngleBetweenVec2s(intersection, nextPoint);
                    const endClockwiseAngle = Vec.getAngleBetweenVec2s(intersection, prevPoint);
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
                } else {
                    console.error('Next point or prev point is undefined. This error should never occur.');
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
    // Remove fully identical polygons or else 2 identical polygons not touching any others
    // will cancel each other out because there will be no start point to begin processing.
    for (let i = polygons.length - 1; i >= 0; i--) {
        const polygon = polygons[i];
        if (polygon) {
            for (let otherPoly of polygons) {
                // Don't test against self
                if (polygon == otherPoly) {
                    continue;
                }
                if (arePolygonsEquivalent(polygon, otherPoly)) {
                    polygons.splice(i, 1);
                    break;
                }

            }
        }
    }

    // Convert all polygons into polygon line segments for processing:
    const polygonLineSegments = polygons.map(polygonToPolygonLineSegments).flat();

    // resultPolys stores the merged polygons:
    const resultPolys: Polygon[] = [];
    // Polygons that failed to process
    const badPolys: Polygon[] = [];


    // excludedPoly is used to ensure that polys are not processed more than once
    // especially because they may be processed in an inner loop.  newPolys added to
    // resultPolys do not need to be processed because as they are created they are
    // merged with ALL other polys that they are in contact with
    const excludePoly: Set<Polygon> = new Set();

    // Returns true if polygon processes successfully
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
        const originalFirstPoint = originalPolyPoints[0];
        const originalSecondPoint = originalPolyPoints[1];
        if (!originalFirstPoint || !originalSecondPoint) {
            // Polygon cannot be processed because we can't find it's array of points starting from firstPoint
            badPolys.push(processingPolygon);
            return false;
        }
        // p1 represents the last intersection, and p2 is where it INTENDS to go to next
        let currentLine: PolygonLineSegment = { p1: originalFirstPoint, p2: originalSecondPoint, polygon: processingPolygon };
        const newPoly: Polygon = { points: [], inverted: false };
        // The first point to iterate is also the firstPoint of the new poly
        newPoly.points.push(originalFirstPoint);
        // TODO update loop limit to something not just for testing
        const loopLimit = 200;
        // TODO handle bad polys in a more sustainable way
        let i = 0;
        do {
            if (++i > loopLimit) {
                console.error('Hit loopLimit for polygon processing.  May be an infinite loop or the polygon may just be too big.', newPoly.points);
                return false;

            }
            // This poly is processing, mark it as excluded so it won't start processing from the beginning
            excludePoly.add(currentLine.polygon);
            const branch = getClosestBranch(currentLine, polygonLineSegments);
            if (branch === undefined) {
                console.error('Branch is undefined')
                return false;
            }
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
        const processedSuccessfully = processPolygon(startProcessingPolygon);
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
    growOverlappingCollinearLinesInDirectionOfP2,
    arePolygonsEquivalent,
    getPointNormalVector
}