import { getAngleBetweenVec2s, Vec2 } from "./Vec";
import * as vectorMath from './collision/vectorMath';
import { distance, similarTriangles } from "./math";
import { LineSegment, lineSegmentIntersection } from "./collision/collisionMath";
import { clockwiseAngle, counterClockwiseAngle } from "./Pathfinding";

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
// find the closest intersections to line.p1
// It may return more than 1 intersections if there are multiple intersections at exactly the same point
function getClosestIntersectionsWithWalls(line: PolygonLineSegment, walls: PolygonLineSegment[]): { intersectingWalls?: PolygonLineSegment[], closestIntersection?: Vec2 } {
    let intersectingWalls: PolygonLineSegment[] = [];
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
            const dist = distance(line.p1, intersection);
            // If there is no closest intersection, make this intersection the closest intersection
            if (!closestIntersection || closestIntersectionDistance == undefined) {
                closestIntersection = intersection;
                closestIntersectionDistance = dist;
                intersectingWalls = [wall]
            } else if (closestIntersectionDistance > dist) {
                // If there is and this intersection is closer, make it the closest
                closestIntersection = intersection;
                closestIntersectionDistance = dist;
                intersectingWalls = [wall]
            } else if (closestIntersectionDistance == dist) {
                // Intersections are identical, add wall to the list
                intersectingWalls.push(wall);
            }
        }
    }
    return { intersectingWalls, closestIntersection };
}
// Given an array of PolygonLineSegment[], of all the intersections between line and the walls,
// find the closest intersection to line.p1
function getClosestIntersectionWithWallsIncludingStartPoint(line: PolygonLineSegment, walls: PolygonLineSegment[]): { intersectingWall?: PolygonLineSegment, closestIntersection?: Vec2 } {
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
    // if (intersectingWall) {
    //     console.log('found intersection for line', line, closestIntersection);
    // }
    return { intersectingWall, closestIntersection };
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
        // console.log('found intersection for line', line, closestIntersection);
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
    return vectorMath.round(vectorMath.subtract(point, relativeAdjustedPoint));
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
        if (intersection && !intersections.find(i => vectorMath.equal(i, intersection))) {
            intersections.push(intersection);
            // If the intersection is at a vertex of the polygon, this is a special case and must be handled by checking the
            // angles of what happens when the line goes through the intersection
            // This logic solves these corner cases:
            // 1. point is same location as a vertex of the polygon (inside)
            // 2. point is horizontal to a vertex of the polygon (possibly inside or outside)
            // 3. point is colinear with, but not on, a horizontal edge of the polygon (possibly inside or outside)
            // 4. point is on a horizontal edge of the polygon (inside)
            if (vectorMath.equal(intersection, wall.p1) || vectorMath.equal(intersection, wall.p2)) {
                // Get the INSIDE angle of the vertex (relative to it's polygon)
                const indexOfVertex = polygon.points.findIndex(p => vectorMath.equal(p, intersection));
                const startClockwiseAngle = getAngleBetweenVec2s(intersection, polygon.points[getLoopableIndex(indexOfVertex + 1, polygon.points)]);
                const endClockwiseAngle = getAngleBetweenVec2s(intersection, polygon.points[getLoopableIndex(indexOfVertex - 1, polygon.points)]);
                // Take the vectors: line.p1 (the point) to vertex/intersection and vertex/intersection to line.p2
                const v1Angle = getAngleBetweenVec2s(intersection, horizontalLine.p1);
                const v2Angle = getAngleBetweenVec2s(intersection, horizontalLine.p2);
                const allowableAngle = clockwiseAngle(startClockwiseAngle, endClockwiseAngle);
                const v1AngleInside = vectorMath.equal(intersection, point) || clockwiseAngle(startClockwiseAngle, v1Angle) <= allowableAngle;
                const v2AngleInside = clockwiseAngle(startClockwiseAngle, v2Angle) <= allowableAngle;
                // Only flip if v1AngleInside XOR v2AngleInside
                if (v1AngleInside !== v2AngleInside) {
                    isInside = !isInside;

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
// The rule: inside points get removed, intersections become new points
export function mergeOverlappingPolygons(polygons: Polygon[]): Polygon[] {
    // Remove all polygons that have NO points outside of all other polygons
    let flagForRemoval: Polygon[] = [];
    for (let polygon of polygons) {
        let firstPoint = findFirstPointNotInsideAnotherPoly(polygon, polygons.filter(p => !flagForRemoval.includes(p)));
        if (!firstPoint) {
            flagForRemoval.push(polygon);
        }
    }
    polygons = polygons.filter(p => {
        return !flagForRemoval.includes(p);
    });

    const limit = 2 * polygons.reduce((verticiesCount, poly) => verticiesCount + poly.points.length, 0);
    console.log('Running with iteration limit', limit);
    const resultPolys: Polygon[] = [];
    // Convert all polygons into polygon line segments for processing:
    const polygonLineSegments = polygons.map(polygonToPolygonLineSegments).flat();
    // excludedPoly is used to ensure that polys are not processed more than once
    // especially because they may be processed in an inner loop.  newPolys added to
    // resultPolys do not need to be processed because as they are created they are
    // merged with ALL other polys that they are in contact with
    const excludePoly: Set<Polygon> = new Set();
    // Step 1. Loop through all polys to see if they need to merge
    for (let polygon of polygons) {
        console.log('start with poly', polygons.findIndex(p => p == polygon));
        if (excludePoly.has(polygon)) {
            console.log('polygon is excluded, do not process');
            continue;
        }

        // Step 2. Start with the first point on this polygon that is NOT inside
        // ANY other polygons.
        // Note: only consider polygons that have yet to be processed because since a processed polygon
        // will absorb ALL touching polygons, the next polygon to be processed can't be touching / inside
        // an already processed polygon.  This filter also allows identical polygons to be processed
        // because without it, none of them would have any points outside of all other polygons.
        let firstPoint = findFirstPointNotInsideAnotherPoly(polygon, polygons);
        if (!firstPoint) {
            console.log('no outside point found, do not process');
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
        // Return status signifies success
        function iteratePolygon(iteratingPolygon: Polygon, points: Vec2[], env: { polygons: Polygon[], excludePoly: Set<Polygon>, polygonLineSegments: PolygonLineSegment[] }, lastLineAngle: number, newPoly: Polygon): boolean {
            const { polygons, polygonLineSegments, excludePoly } = env;
            // Now that this poly has begun processing, mark it as excluded so it won't be processed again
            excludePoly.add(polygon);
            let loop = 0;
            for (let index = 0; index < points.length; index++) {
                loop++;
                if (loop > 200 || newPoly.points.length > limit) {
                    console.log('exit due to infinite loop', newPoly);
                    // TODO handle this unexpected situation better without just returning no polys, maybe keep the good ones?
                    return false;

                }
                const point = points[index];
                // Success condition: If current point the first point in newpoly, the polygon is now closed, exit successfully
                if (newPoly.points[0] && vectorMath.equal(newPoly.points[0], point)) {
                    console.log('exit successfully,  polygon is closed', point);
                    return true;
                }

                console.log('new point', point, 'currentPoly', polygons.findIndex(p => p == iteratingPolygon), 'newPoly', newPoly.points);

                // Add the point to the newPoly (so long as it's not a duplicate)
                if (!(newPoly.points.length && vectorMath.equal(newPoly.points[newPoly.points.length - 1], point))) {
                    newPoly.points.push(point);
                }

                const iteratingPolyNextPoint = points[getLoopableIndex(index + 1, points)];
                let iteratingPolyCurrentWall = { p1: point, p2: iteratingPolyNextPoint, polygon: iteratingPolygon };

                const { intersectingWalls, closestIntersection } = getClosestIntersectionsWithWalls(iteratingPolyCurrentWall, polygonLineSegments);
                // Step 4. When we detect an intersection we test all the branch angles.
                // If there is one that is a smaller clockwise angle from the last angle, take the branch
                if (intersectingWalls && intersectingWalls.length && closestIntersection) {
                    // Update the lastLineAngle only if the intersection and the last point are not identical
                    // because that would incorrectly return an angle of 0 when what we want is the angle between
                    // the intersection and the last (different) point of the new poly
                    if (!vectorMath.equal(closestIntersection, newPoly.points[newPoly.points.length - 1])) {
                        lastLineAngle = getAngleBetweenVec2s(closestIntersection, newPoly.points[newPoly.points.length - 1]);
                    }
                    // console.log('new intersection', closestIntersection, 'lastLineAngle', lastLineAngle * 180 / Math.PI);
                    if (newPoly.points[0] && vectorMath.equal(newPoly.points[0], closestIntersection)) {
                        console.log('exit successfully,  polygon is closed', closestIntersection);
                        break;
                    }
                    // If not a duplicate of the last newPoly point, add the intersection
                    if (!(newPoly.points.length && vectorMath.equal(newPoly.points[newPoly.points.length - 1], closestIntersection))) {
                        newPoly.points.push(closestIntersection);
                    }

                    // For the current poly wall and all walls intersecting the closestIntersection point, get information for all possible
                    // branches so we can determine which poly to iterate next (it may remain the same poly)
                    if (iteratingPolygon.inverted) {
                        iteratingPolyCurrentWall = { p1: iteratingPolyCurrentWall.p2, p2: iteratingPolyCurrentWall.p1, polygon: iteratingPolyCurrentWall.polygon };
                    }
                    const branches = [iteratingPolyCurrentWall, ...intersectingWalls].map(wall => {
                        // Use "next" point when iterating the other poly clockwise
                        let otherPolyStartPoint = wall.p2;
                        if (wall.polygon.inverted) {
                            // but if the other poly is inverted, use the "prev" point (for iterating counter clockwise)
                            otherPolyStartPoint = wall.p1;
                        }
                        // console.log('WALL', wall, 'start point', otherPolyStartPoint);
                        const otherPolyNextPoints = getPointsFromPolygonStartingAt(wall.polygon, otherPolyStartPoint);
                        const nextPoint = vectorMath.equal(otherPolyNextPoints[0], closestIntersection) ? otherPolyNextPoints[1] : otherPolyNextPoints[0];
                        const nextLineAngle = getAngleBetweenVec2s(closestIntersection, nextPoint);

                        return {
                            // and angle from the last line to the next line if this branch were to be taken
                            branchAngle: clockwiseAngle(lastLineAngle, nextLineAngle),
                            nextPoints: otherPolyNextPoints,
                            polygon: wall.polygon
                        }
                    }).sort((a, b) => {
                        return a.branchAngle - b.branchAngle;
                    });

                    console.log('branches', branches.map(b =>
                        ({ polygon: polygons.findIndex(o => o == b.polygon), branchAngle: b.branchAngle * 180 / Math.PI, nextPoints: JSON.stringify(b.nextPoints) })));


                    // Take the branch with the smallest clockwise angle:
                    const branchToTake = branches[0];

                    // If the intersecting poly is inverted, the new poly must become inverted.
                    // Any poly that merged with an inverted poly becomes an inverted poly
                    if (branchToTake.polygon.inverted) {
                        // Switch newPoly to inverted
                        newPoly.inverted = true;
                    }
                    if (iteratingPolygon == branchToTake.polygon) {
                        // Don't recurse if it should carry on iterating on the polygon it
                        // already is iterating on
                        console.log('skip intersection, don\'t reset loop.  Carry on');
                        continue;
                    }

                    if (branchToTake.polygon !== iteratingPolygon) {
                        console.log('  branch at', closestIntersection, 'to poly', polygons.findIndex(p => p == branchToTake.polygon));
                    }
                    // Recurse, to start iterating on the branching polygon
                    iteratePolygon(branchToTake.polygon, branchToTake.nextPoints, env, lastLineAngle, newPoly);
                    return true;
                }

            }
            // It should exit by finding the start point, not by running out of points to process
            return false

        }
        iteratePolygon(polygon, originalPolyPoints, { polygons, excludePoly, polygonLineSegments }, 0, newPoly);

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
    findFirstPointNotInsideAnotherPoly,
    getNormalVectorOfLineSegment
}