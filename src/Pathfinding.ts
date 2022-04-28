import { isAngleBetweenAngles } from "./Angle";
import { findWherePointIntersectLineSegmentAtRightAngle, isPointOnLineSegment, LineSegment, lineSegmentIntersection } from "./collision/collisionMath";
import { distance } from "./math";
import { getPointsFromPolygonStartingAt, doesVertexBelongToPolygon, Polygon, PolygonLineSegment, polygonToPolygonLineSegments, isVec2InsidePolygon, doesLineFromPointToTargetProjectAwayFromOwnPolygon, getInsideAnglesOfWall } from "./Polygon";
import type { Vec2 } from './Vec';
import * as Vec from './Vec';
import * as math from './math';

// Will return either an array with 1 normal polygon or an array with 1 or more 
// inverted polygons 
export function findPolygonsThatVec2IsInsideOf(point: Vec2, testPolygons: Polygon[]): Polygon[] {
    let insideOfPolys: Polygon[] = [];
    for (let poly of testPolygons) {
        // Exclude inverted polygons because if there is more than 1
        // inverted polygon, and since inverted polygons' "insides"
        // are actually on the outside; there'll be a false positive
        // where a target in a valid location, will get flagged as
        // "inside" an inverted polygon.  Maybe this calls for the concept
        // of inverted polygons to be rethought, since it really only works
        // when there is only one single inverted polygon
        if (!poly.inverted) {
            if (isVec2InsidePolygon(point, poly)) {
                insideOfPolys = [poly];
                // Exit immediately if the point is inside a non-inverted polygon
                // since overlapping polygons should be merged, we can assume it
                // is only inide this one polygon
                break;
            }
        }

    }
    // If the target is NOT inside any non-inverted polygons
    // Check if it's "inside" (outside) ALL inverted polys
    // If it is outside of ALL inverted polygons, that means that the
    // target is invalid so we have to find the closest valid target to path to
    if (insideOfPolys.length == 0) {
        for (let poly of testPolygons) {
            if (poly.inverted) {
                if (isVec2InsidePolygon(point, poly)) {
                    insideOfPolys.push(poly);
                } else {
                    // If the target is outside (in valid walk space) any single
                    // inverted polygon then the location is valid
                    insideOfPolys = [];
                    break;
                }
            }
        }
    }
    return insideOfPolys;
}
interface Path {
    // done represents that the path should no longer be processing;
    // it gives no guaruntee as to the validity of the path
    done: boolean;
    // A invalid path does not path to the target and can be ignored
    invalid: boolean;
    points: Vec2[];
    // The end of the path
    target: Vec2;
    // The distance that the full path traverses
    distance: number;
    walkAroundPolyInfo?: {
        // A mutatable array of verticies that the pathing process with shift()
        // one at a time to walk around the polygon
        verticies: Vec2[];
        // The original polygon
        poly: Polygon;
    };
}
export function findPath(startPoint: Vec2, target: Vec2, polygons: Polygon[]): Vec2[] {
    // If the target is inside of a non-inverted polygon, move it to the closest edge so that
    // the unit can path to the closest pathable point near where they are attempting to go.
    // This is important if, for example, a player clicks in empty space which is inside
    // of the poly but not inside an obstacle.  The pathing should take the unit
    // as close as it can go without intersecting the polygon
    const targetInsideOfPolys: Polygon[] = findPolygonsThatVec2IsInsideOf(target, polygons);

    window.debugGraphics.clear();
    // If the real target is in an invalid location,
    // find the closest valid target to represent the endpoint of the path
    if (targetInsideOfPolys.length) {
        const nearPointsOnWalls = [];
        for (let poly of targetInsideOfPolys) {
            for (let wall of polygonToPolygonLineSegments(poly)) {
                const intersection = findWherePointIntersectLineSegmentAtRightAngle(target, wall);
                if (intersection) {
                    // window.debugGraphics.lineStyle(3, 0xff0000, 1.0);
                    // window.debugGraphics.drawCircle(intersection.x, intersection.y, 3);
                    nearPointsOnWalls.push(intersection);
                }

            }
            targetInsideOfPolys.map(p => p.points).flat().forEach(point => {
                // window.debugGraphics.lineStyle(3, 0x00ff00, 1.0);
                // window.debugGraphics.drawCircle(point.x, point.y, 3);
                nearPointsOnWalls.push(point);
            });
        }
        // Find the closest of the nearPointsOnWalls 
        if (nearPointsOnWalls[0]) {
            const closest = nearPointsOnWalls.reduce<{ intersection: Vec2, dist: number }>((acc, cur) => {
                const dist = distance(cur, target)
                if (dist <= acc.dist) {
                    return { intersection: cur, dist };
                } else {
                    return acc;
                }

            }, { intersection: nearPointsOnWalls[0], dist: Number.MAX_SAFE_INTEGER })
            // window.debugGraphics.lineStyle(3, 0x0000ff, 1.0);
            // window.debugGraphics.drawCircle(closest.intersection.x, closest.intersection.y, 4);
            // Override target with a location that the unit can actually fit in:
            target = closest.intersection;
        }
    }

    // Process the polygons into pathingwalls for use in tryPath
    const pathingWalls = polygons.map(polygonToPolygonLineSegments).flat();

    let paths: Path[] = [
        // Start with the first idea path from start to target
        // Note, the distance is calculated inside of processPaths even if 
        // there are no interruptions to the path and it just goes from startPoint
        // to target.
        { done: false, invalid: false, points: [startPoint], target, distance: 0 }
    ];

    // There is a processingLimit to prevent infinite processing.
    // But this particular number is arbitrary.
    const processingLimit = 30;
    // Allow processing up to "processingLimit" times.
    // Paths often need to be processed multiple times since
    // one invokation of processPaths only changes the paths slightly
    // as they get closer and closer to finding their way to the target.
    for (let i = 0; i < processingLimit; i++) {
        // Takes 1 step closer to finishing paths
        paths = processPaths(paths, pathingWalls);

        // Optimization
        calculateDistanceOfPaths(paths);
        const shortestFinishedPaths = paths.filter(p => p.done && !p.invalid).sort((a, b) => a.distance - b.distance);
        if (shortestFinishedPaths[0]) {
            const shortestFinishedDistance = shortestFinishedPaths[0].distance;
            // Make all paths that are already longer than the shortest, finished path invalid.
            // even if they are not done processing, because even if they'd be valid, they would be
            // longer than the current shortest, valid path; and thus, not a path we'd choose
            for (let path of paths) {
                if (!path.done && path.distance > shortestFinishedDistance) {
                    path.invalid = true;
                    path.done = true;
                }

            }
        }

        // Once all paths are "done", stop processing
        if (paths.every(p => p.done)) {
            break;
        }
    }

    // Now that processing is over, mark all paths that aren't done as invalid:
    paths.forEach(path => {
        if (!path.done) {
            path.invalid = true;
            path.done = true;
        }
    })

    // Debug: Draw the paths:
    // for (let i = 0; i < paths.length; i++) {
    //     // Visual offset is useful for representing overlapping paths in a way where you can see
    //     // all of them
    //     const visualOffset = i * 5;
    //     const path = paths[i];
    //     if (path.invalid) {
    //         window.debugGraphics.lineStyle(4, 0xff0000, 0.3);
    //     } else {
    //         window.debugGraphics.lineStyle(4, 0x00ff00, 0.4);
    //     }
    //     window.debugGraphics.moveTo(path.points[0].x + visualOffset, path.points[0].y + visualOffset);
    //     for (let point of path.points) {
    //         if (path.invalid && point == path.points[path.points.length - 1]) {
    //             // Don't draw last point since the path didn't finish
    //             break;
    //         }
    //         window.debugGraphics.lineTo(point.x + visualOffset, point.y + visualOffset);
    //     }

    //     // Finally, draw to the target, unless the path is invalid (in which case it didn't make
    //     // it to the target); 
    //     if (!path.invalid) {
    //         window.debugGraphics.lineTo(path.target.x + visualOffset, path.target.y + visualOffset);
    //     }
    // }
    // console.log('paths', paths.filter(p => !p.invalid).length, '/', paths.length);

    // Remove invalid paths
    paths = paths.filter(p => !p.invalid);

    // Find the shortest Path
    // --
    // Note: Must recalculate the distance of the paths
    // before finding the shortest path.  This currently happens
    // right after processPaths is invoked
    const shortestPath = paths.reduce<Path | undefined>((shortest, contender) => {
        if (shortest === undefined) {
            return contender
        } else {
            if (shortest.distance > contender.distance) {
                return contender;
            } else {
                return shortest
            }
        }
    }, undefined);

    // Optimize path by removing unnecessary points
    // If there is an unobstructed straight line between two points, you can remove all the points in-between
    if (shortestPath) {
        // returns true if fully optimized
        function tryOptimizePath(path: Path): boolean {
            for (let i = 0; i < path.points.length; i++) {
                for (let j = path.points.length - 1; j > i + 1; j--) {
                    const p1 = path.points[i];
                    const p2 = path.points[j];
                    if (!(p1 && p2)) {
                        console.error('Loop malformed. p1 or p2 is undefined')
                        continue;
                    }
                    const nextLine = { p1, p2 }
                    let { intersectingWall, closestIntersection } = getClosestIntersectionWithWalls(nextLine, pathingWalls);
                    if (intersectingWall) {
                        const intersectingPoly = intersectingWall.polygon;

                        const indexIfP2IsOnVertex = intersectingPoly.points.findIndex(p => Vec.equal(p, nextLine.p2));
                        if (indexIfP2IsOnVertex !== -1) {
                            const lineToTargetDoesNotPassThroughOwnPolygon =
                                doesLineFromPointToTargetProjectAwayFromOwnPolygon(intersectingPoly, indexIfP2IsOnVertex, nextLine.p1);
                            if (!lineToTargetDoesNotPassThroughOwnPolygon) {
                                // Skip, this optimization is invalid because it would cut through a polygon
                                continue;
                            }
                        } else {
                            // Then p2 is on a wall
                            const insideAngleOfWall = getInsideAnglesOfWall(intersectingWall);
                            const lineIsCastIntoNoWalkZone = isAngleBetweenAngles(
                                Vec.getAngleBetweenVec2s(nextLine.p2, nextLine.p1), insideAngleOfWall.start, insideAngleOfWall.end
                            );
                            if (lineIsCastIntoNoWalkZone) {
                                // Skip, this optimization is invalid because it would cut through a polygon
                                continue;
                            }
                        }
                        if (!closestIntersection || Vec.equal(closestIntersection, p2)) {
                            // window.debugGraphics.lineStyle(1, 0xff0000, 1);
                            // window.debugGraphics.drawCircle(path.points[i].x, path.points[i].y, 4);
                            // window.debugGraphics.lineStyle(1, 0x0000ff, 1);
                            // window.debugGraphics.drawCircle(path.points[j].x, path.points[j].y, 4);
                            path.points = removeBetweenIndexAtoB(path.points, i, j);
                            return false
                        }
                    }
                }
            }
            return true;
        }
        // Run optimization twice
        tryOptimizePath(shortestPath);
        tryOptimizePath(shortestPath);
        // let fullyOptimized = false;
        // do {
        //     fullyOptimized = tryOptimizePath(shortestPath);
        // } while (!fullyOptimized);
    }

    if (shortestPath) {
        // Remove the start point, since the unit doing the pathing is already at the start point:
        shortestPath.points.shift();
    }
    return shortestPath ? [...shortestPath.points, shortestPath.target] : [];
}
// Note: Mutates Path
function addWalkAroundPolyInfoToPath(path: Path, direction: 'prev' | 'next', startVertex: Vec2, poly: Polygon) {
    // Walk all the way around a poly in "direction" (clockwise/next or counterclockwise/prev) until you have 
    // a straight line path to the target, or until the straight line path
    // to the target intersects another PolygonLineSegment
    // --
    // Note: walkAroundAPoly adds "target" to the end of the path when it is finished
    // --
    // Now keep iterative in the "direction" until we have a path that doesn't intersect with this polygon
    // and heads right for the target or intersects with another polygon:
    const _verticies = getPointsFromPolygonStartingAt(poly, startVertex);
    // If the direction is 'prev', walk in the opposite direction
    const verticies = direction == 'prev' ? _verticies.reverse() : _verticies;
    path.walkAroundPolyInfo = {
        verticies,
        poly
    }

}
function walkAroundAPoly(path: Path, pathingWalls: PolygonLineSegment[]) {
    if (!path.walkAroundPolyInfo) {
        // Cannot walk if there is no walk info
        return;
    }
    const vertex = path.walkAroundPolyInfo.verticies.shift();
    if (!vertex) {
        // No verticies left to be processed
        return;
    }
    // If the target point is on the line between the last point and this point, we've found the path and can exit.
    // This occurs if the target point lies directly on an edge of the current polygon
    const endPoint = path.points[path.points.length - 1]
    if (endPoint && isPointOnLineSegment(path.target, { p1: endPoint, p2: vertex })) {
        path.done = true
        return;
    }

    path.points.push(vertex);
    // Check if a straight line between the new vertex and the target passes through the current polygon
    const indexOfVertex = path.walkAroundPolyInfo.poly.points.findIndex(p => Vec.equal(p, vertex));
    // true if line to target doesn't pass through own polygon
    let lineToTargetDoesNotPassThroughOwnPolygon = false;
    if (indexOfVertex >= 0) {
        lineToTargetDoesNotPassThroughOwnPolygon = doesLineFromPointToTargetProjectAwayFromOwnPolygon(path.walkAroundPolyInfo.poly, indexOfVertex, path.target);
    }
    // if !lineToTargetDoesNotPassThroughOwnPolygon then
    // line cast to target DOES pass through the inside of this vertex's angle so it is invalid to branch.
    // Thus, keep walking around the polygon
    // Continue to check the next or previous (depending on direction) vertex for this poly
    // we need to keep walking around it to continue the path

    // otherwise, line from vertex to the target is not cast through the inside angle of vertex and thus it MAY
    // be valid to jump of the poly / branch
    if (lineToTargetDoesNotPassThroughOwnPolygon) {
        // Check if a straight line between the new vertex and the target collides with any walls
        const { intersectingWall, closestIntersection } = getClosestIntersectionWithWalls({ p1: vertex, p2: path.target }, pathingWalls);
        // If it does
        if (intersectingWall && closestIntersection) {
            // and the wall belongs to the current poly
            if (doesVertexBelongToPolygon(vertex, intersectingWall.polygon) && doesVertexBelongToPolygon(intersectingWall.p1, intersectingWall.polygon)) {
                // A straight line from vertex to target intersects the same polygon again but is probably closer,
                // so we'll branch off the new intersection point

                // Exception: Don't branch off if it's branching into a polygonlinesegment that THIS path already contains
                if (path.points.find(p => p == intersectingWall.p1) && path.points.find(p => p == intersectingWall.p2)) {
                    // Continue walking polygon
                } else {
                    // Allowing jumping to intersecting wall
                    // so, clear walking info so it will stop walking and jump
                    path.walkAroundPolyInfo = undefined;
                }
            } else {
                // If it belongs to a different poly, then we can stop walking because
                // we've walked the path as far around the current poly as we need to in order
                // to continue pathing towards the target by walking a different poly
                // so, clear walking info so it will stop walking and jump
                path.walkAroundPolyInfo = undefined;
            }
        } else {
            // Stop if there is no intersecting wall, the path is complete because it has reached the poly
            // so, clear walking info because it is done
            path.walkAroundPolyInfo = undefined;
            path.done = true;
        }
    }
}
// Processes each path by ensuring that there is a valid line between each of the paths points,
// and if there is not it will add points until either the path is invalid or the path is complete
// --
// Note: Mutates the paths array's objects
function processPaths(paths: Path[], pathingWalls: PolygonLineSegment[]): Path[] {
    // Continue to process paths that are incomplete
    tryAllPaths:
    for (let path of paths) {
        // Do not continue to process paths that are complete
        if (path.done) {
            continue;
        }
        // A path must have at least 1 point (a start and path.target is the end) to be processed
        if (path.points.length < 1) {
            console.error("Path is too short to process");
            path.invalid = true;
            path.done = true;
            continue;
        }

        // There are 2 main ways to process a path, if the path has "walkAroundPolyInfo",
        // that means it is currently in the process of walking around a polygon's verticies,
        // one by one, so it should be processed with walkAroundAPoly()
        // Otherwise, it drops into the "else" below and tests the last line in the path
        // to see if it's a valid line, if not, that means it intersected at least 1 polygonLineSegment
        // which means the path has to branch into two paths in order to "walkAround" the polygon that
        // it intersected with, and so it will assign walkAroundPolyInfo so that next time the path is
        // processed it will walk around.
        if (path.walkAroundPolyInfo) {
            walkAroundAPoly(path, pathingWalls);
        } else {
            const nextStraightLine: LineSegment = getLastLineInPath(path);

            // Check for collisions between the last line in the path and pathing walls
            // path.points.length === 1 because includeStartPoint should be true if this is the very beginning of the path in case
            // the unit is already on an edge of a polygon
            let { intersectingWall, closestIntersection } = getClosestIntersectionWithWalls(nextStraightLine, pathingWalls, path.points.length == 1);
            // If there is an intersection between a straight line path and a pathing wall
            // we have to branch the path to the corners of the wall and try again
            if (intersectingWall && closestIntersection) {
                if (Vec.equal(closestIntersection, nextStraightLine.p2)) {
                    // This is the "happy path", a straight line without collisions has been found to the target
                    // and the path is complete

                    // Mark the path as "done"
                    path.done = true;

                } else {
                    path.points.push(closestIntersection);
                    // window.debugGraphics.lineStyle(2, 0xff00ff, 1);
                    // window.debugGraphics.drawCircle(closestIntersection.x, closestIntersection.y, 10);

                    // Prevent paths from overlapping already existing paths:
                    // This is very important because it prevents infinitely
                    // spawning new paths in the event that a path enters a loop where
                    // it hits a branch that another path has already processed.
                    checkPaths:
                    for (let otherPath of paths) {
                        // Don't compare a currently processing path to an invalid path
                        if (otherPath.invalid) {
                            continue;
                        }
                        // Don't check a path for overlap against itself
                        if (otherPath !== path) {
                            for (let i = 0; i < otherPath.points.length; i++) {
                                const point = otherPath.points[i];
                                // If the closestIntersection is the same as a point from another path
                                // invalidate the longer path, since whichever path is shorter is
                                // a quicker route to that point
                                if (point && Vec.equal(closestIntersection, point)) {
                                    const lengthOfCurrentPathToThisVertex = calculateDistanceOfVec2Array([...path.points, closestIntersection]);
                                    const lengthOfOtherPathToThisVertex = calculateDistanceOfVec2Array(otherPath.points.slice(0, i + 1));
                                    if (lengthOfCurrentPathToThisVertex < lengthOfOtherPathToThisVertex) {
                                        // Stop the other path, it is invalid since the current path
                                        // has a shorter route to this intersection
                                        // Note: This might be a misuse of invalid since the path technically isn't
                                        // invalid, but I will allow it since we want to exclude this path
                                        // because the shorter path will certainly be a better route
                                        otherPath.invalid = true;
                                        otherPath.done = true;
                                        continue checkPaths;

                                    } else {
                                        // Stop the current path, it is invalid since the other path has
                                        // a shorter route to this vertex

                                        // Draw where path stopped
                                        // window.debugGraphics.lineStyle(1, 0x00ffff, 1);
                                        // window.debugGraphics.drawCircle(vertex.x, vertex.y, 10);

                                        path.invalid = true;
                                        path.done = true;
                                        // Since the current path is found to be invalid, don't
                                        // let it branch into new paths
                                        continue tryAllPaths;
                                    }
                                }
                            }
                        }
                    }

                    let { next, prev } = polygonLineSegmentToPrevAndNext(intersectingWall);

                    // Branch the path.  The original path will try navigating around p1
                    // and the branchedPath will try navigating around p2.
                    // Note: branchedPath must be cloned before path's p2 is modified
                    const branchedPath = { ...path, points: path.points.map(p => Vec.clone(p)) };
                    paths.push(branchedPath);

                    const nextWalkPoint = intersectingWall.polygon.inverted ? prev : next;


                    // Starting from the "prev" corner, walk around the poly until you can make a 
                    // straight line to the target that doesn't intersect with this same poly
                    // Note: It is INTENTIONAL that "next" is passed into this function because the ordered verticies
                    // will be reversed when 'prev' is the direction
                    addWalkAroundPolyInfoToPath(path, 'prev', nextWalkPoint, intersectingWall.polygon);
                    // Starting from the "next" corner, walk around the poly until you can make a 
                    // straight line to the target that doesn't intersect with this same poly
                    addWalkAroundPolyInfoToPath(branchedPath, 'next', nextWalkPoint, intersectingWall.polygon);
                }

            } else {
                // If no intersections were found then we have a path to the target, so stop processing this path.
                // This is the "happy path", a straight line without collisions has been found to the target
                // and the path is complete

                // Mark the path as "done"
                path.done = true;
            }
        }
    }

    return paths
}
export function removeBetweenIndexAtoB(array: any[], indexA: number, indexB: number): any[] {
    // indexA must be < indexB, if invalid args are passed in, return the values of the array
    if (indexA >= indexB) {
        return [...array];
    }
    return [...array.slice(0, indexA + 1), ...array.slice(indexB)]
}
function calculateDistanceOfPaths(paths: Path[]) {
    // Calculate the distance for all paths
    for (let path of paths) {
        path.distance = calculateDistanceOfVec2Array([...path.points, path.target]);
    }
}
export function calculateDistanceOfVec2Array(points: Vec2[]) {
    let totalDistance = 0;
    // Finally, calculate the distance for the path 
    for (let i = 0; i < points.length - 2; i++) {
        const point = points[i];
        const nextPoint = points[i + 1];
        if (point !== undefined && nextPoint !== undefined) {
            totalDistance += distance(point, nextPoint);
        } else {
            console.error('loop is malformed')
        }
    }
    return totalDistance;
}
function polygonLineSegmentToPrevAndNext(wall: PolygonLineSegment): { prev: Vec2, next: Vec2 } {
    return { prev: wall.p1, next: wall.p2 };
}
function getLastLineInPath(path: Path): LineSegment {
    const lastPoint = path.points[path.points.length - 1]
    if (lastPoint) {
        return { p1: lastPoint, p2: path.target };
    } else {
        console.error("Path contains no points");
        return { p1: path.target, p2: path.target };
    }

}
// Given an array of PolygonLineSegment[], of all the intersections between line and the walls,
// find the closest intersection to line.p1
// --
// Most of the time, we want to ignore if there is a collision at line.p1, because
// any point on an edge of a poly will register as a collision with that poly even
// if we are drawing the line AWAY from the poly.  However, there is one case when we
// do want to allow the closestIntersection to be p1 and that is when we are starting
// a new path because if the unit's start point is already on an edge of a poly, if we 
// don't allow for collisions with line.p1, they will path right through the poly that
// they are already on the edge of.
function getClosestIntersectionWithWalls(line: LineSegment, walls: PolygonLineSegment[], includeStartPoint: boolean = false): { intersectingWall?: PolygonLineSegment, closestIntersection?: Vec2 } {
    let intersectingWall;
    let closestIntersection;
    let closestIntersectionDistance;
    // Check for collisions between the last line in the path and pathing walls
    for (let wall of walls) {
        const intersection = lineSegmentIntersection(line, wall);
        if (intersection) {
            // If the intersection is at the start point of the line...
            if (Vec.equal(line.p1, intersection)) {
                if (!includeStartPoint) {
                    // Since this intersection is at the start point and includeStartPoint is false
                    // do not include this intersection
                    continue;
                } else {
                    // If the line is cast towards the walkable side from the 
                    // polygon, allow it.  Whereas if the line is cast toward the non-walkable
                    // portion of the poly (for normal polys, the inside; for inverted polys, the outside),
                    // it will be considered as an intersection and returned if it is the closest intersection
                    const insideAngleOfWall = getInsideAnglesOfWall(wall);
                    const lineIsCastIntoNoWalkZone = isAngleBetweenAngles(
                        Vec.getAngleBetweenVec2s(line.p1, line.p2), insideAngleOfWall.start, insideAngleOfWall.end
                    );
                    if (!lineIsCastIntoNoWalkZone) {
                        // Ignore the collision
                        continue
                    }
                }
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
    return { intersectingWall, closestIntersection };
}

// If you walked a path dropping a marker every X distance travelled, this function
// returns the locations of the marker.
export function pointsEveryXDistanceAlongPath(startPoint: Vec2, path: Vec2[], distanceOfIncrements: number, alreadyUsedDistance: number = 0): Vec2[] {
    // 0. if "distance" > remaining distance to next point, set next distance to "distance" - remaining distance and go next point
    // 1. else move "distance" along a line and place a marker

    // Rules:
    // Always project new points from the last point in the path
    // If the distance to a point is < the remaining distance to go for the next point, subtrace from the remaining distance to go and continue

    // 3 possibilities:
    // 1. Finish right on a point
    // 2. new point before a point with some left over
    // 3. new point after a point with some left over, 3 turns into 1 or 2
    const points: Vec2[] = [];
    let lastPoint = startPoint;
    let nextDistance = distanceOfIncrements - alreadyUsedDistance;
    for (let point of path) {
        const distanceToPoint = math.distance(lastPoint, point);
        if (nextDistance > distanceToPoint) {
            nextDistance -= distanceToPoint;
        } else {
            let newPoint: Vec2 = lastPoint;
            // Always place at least one point.  In the event that nextDistance is < distanceOfIncrements AND
            // less that distanceToPoint, it still needs a point, so make the for loop execute at least once
            const numberOfPointsOnThisLine = Math.ceil(distanceToPoint / distanceOfIncrements);
            for (let i = 0; i < numberOfPointsOnThisLine; i++) {
                if (nextDistance > distanceToPoint) {
                    break;
                }
                newPoint = math.getCoordsAtDistanceTowardsTarget(
                    lastPoint,
                    point,
                    nextDistance
                )
                points.push(newPoint);
                nextDistance += distanceOfIncrements;
            }
            const leftOver = Math.abs(distance(point, newPoint));
            nextDistance = distanceOfIncrements - leftOver;
        }
        // Always update the lastPoint with the point that was just processed,
        // becauses this is where we will project from to find intermediate points
        lastPoint = point;
    }
    return points
}