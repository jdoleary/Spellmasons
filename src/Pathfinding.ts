import { isAngleBetweenAngles } from "./Angle";
import { findWherePointIntersectLineSegmentAtRightAngle, isPointOnLineSegment, LineSegment, lineSegmentIntersection } from "./collision/collisionMath";
import { distance } from "./math";
import { getPointsFromPolygonStartingAt, doesVertexBelongToPolygon, Polygon, PolygonLineSegment, polygonToPolygonLineSegments, isVec2InsidePolygon, getInsideAnglesOfPoint, doesLineFromPointToTargetProjectAwayFromOwnPolygon, getInsideAnglesOfWall } from "./Polygon";
import type { Vec2 } from './Vec';
import * as Vec from './Vec';


interface Path {
    done: boolean;
    // A invalid path does not path to the target and can be ignored
    invalid: boolean;
    points: Vec2[];
    // The distance that the full path traverses
    distance: number;
}
export function findPath(startPoint: Vec2, target: Vec2, polygons: Polygon[]): Vec2[] {
    // If the target is inside of a non-inverted polygon, move it to the closest edge so that
    // the unit can path to the closest pathable point near where they are attempting to go.
    // This is important if, for example, a player clicks in empty space which is inside
    // of the poly but not inside an obstacle.  The pathing should take the unit
    // as close as it can go without intersecting the polygon
    let targetInsideOfPolys: Polygon[] = [];
    for (let poly of window.underworld.pathingPolygons) {
        // Exclude inverted polygons because if there is more than 1
        // inverted polygon, and since inverted polygons' "insides"
        // are actually on the outside; there'll be a false positive
        // where a target in a valid location, will get flagged as
        // "inside" an inverted polygon.  Maybe this calls for the concept
        // of inverted polygons to be rethought, since it really only works
        // when there is only one single inverted polygon
        if (!poly.inverted) {
            if (isVec2InsidePolygon(target, poly)) {
                targetInsideOfPolys = [poly];
                break;
            }
        }

    }
    // If the target is NOT inside any non-inverted polygons
    // Check if it's "inside" (outside) ALL inverted polys
    // If it is outside of ALL inverted polygons, that means that the
    // target is invalid so we have to find the closest valid target to path to
    if (targetInsideOfPolys.length == 0) {
        for (let poly of window.underworld.pathingPolygons) {
            if (poly.inverted) {
                if (isVec2InsidePolygon(target, poly)) {
                    targetInsideOfPolys.push(poly);
                } else {
                    targetInsideOfPolys = [];
                    break;
                }
            }
        }
    }
    // Find the closest valid target to path to
    if (targetInsideOfPolys.length) {
        const rightAngleIntersections = [];
        for (let poly of targetInsideOfPolys) {
            for (let wall of polygonToPolygonLineSegments(poly)) {
                const intersection = findWherePointIntersectLineSegmentAtRightAngle(target, wall);
                if (intersection) {
                    // window.debugGraphics.lineStyle(3, 0xff0000, 1.0);
                    // window.debugGraphics.drawCircle(intersection.x, intersection.y, 3);
                    rightAngleIntersections.push(intersection);
                }

            }
        }
        // Find the closest of the intersections
        if (rightAngleIntersections.length) {
            const closest = rightAngleIntersections.reduce<{ intersection: Vec2, dist: number }>((acc, cur) => {
                const dist = distance(cur, target)
                if (dist <= acc.dist) {
                    return { intersection: cur, dist };
                } else {
                    return acc;
                }

            }, { intersection: rightAngleIntersections[0], dist: Number.MAX_SAFE_INTEGER })
            // window.debugGraphics.lineStyle(3, 0x0000ff, 1.0);
            // window.debugGraphics.drawCircle(closest.intersection.x, closest.intersection.y, 4);
            // Override target with a location that the unit can actually fit in:
            target = closest.intersection;
        } else {
            // If there are no right angle intersections (which can happen if the point is "inside" an inverted poly at an angle)
            // find the closest vertex and reassign the target so that units don't move inside the inverted poly
            target = targetInsideOfPolys.map(p => p.points).flat().reduce<{ vertex: Vec2, dist: number }>((acc, cur) => {
                const dist = distance(cur, target)
                if (dist <= acc.dist) {
                    return { vertex: cur, dist };
                } else {
                    return acc;
                }

            }, { vertex: targetInsideOfPolys[0].points[0], dist: Number.MAX_SAFE_INTEGER }).vertex;
            // window.debugGraphics.lineStyle(3, 0x0000ff, 1.0);
            // window.debugGraphics.drawCircle(target.x, target.y, 4);

        }
    }

    const pathingWalls = polygons.map(polygonToPolygonLineSegments).flat();
    const paths: Path[] = [
        // Start with the first idea path from start to target
        // Note, the distance is calculated inside of tryPaths even if 
        // there are no interruptions to the path and it just goes from startPoint
        // to target.
        { done: false, invalid: false, points: [startPoint, target], distance: 0 }
    ];
    const shortestPath = tryPaths(paths, pathingWalls, 0);
    if (shortestPath) {
        // Debug: Draw path
        // window.debugGraphics.lineStyle(4, 0xffffff, 0.3);
        // window.debugGraphics.moveTo(shortestPath.points[0].x, shortestPath.points[0].y);
        // for (let point of shortestPath.points) {
        //     window.debugGraphics.lineTo(point.x, point.y);
        // }
        // Remove the start point, since the unit doing the pathing is already at the start point:
        shortestPath.points.shift();
    }
    return shortestPath ? shortestPath.points : [];
}
// Mutates the paths array's objects
function tryPaths(paths: Path[], pathingWalls: PolygonLineSegment[], recursionCount: number): Path | undefined {
    // console.log('tryPaths', recursionCount, paths.map(p => p.points.length).sort());
    calculateDistanceOfPaths(paths);
    const shortestFinishedPaths = paths.filter(p => p.done && !p.invalid).sort((a, b) => a.distance - b.distance);
    if (shortestFinishedPaths.length) {
        const shortestFinishedDistance = shortestFinishedPaths[0].distance;
        // Make all paths that are longer invalid:
        for (let path of paths) {
            if (!path.done && path.distance > shortestFinishedDistance) {
                path.invalid = true;
                path.done = true;
            }

        }
    }

    function walkAroundAPoly(direction: 'prev' | 'next', startVertex: Vec2, poly: Polygon, target: Vec2, pathingWalls: PolygonLineSegment[], path: Path) {
        // Walk all the way around a poly in "direction" until you have a straight line path to the target, or until the straight line path
        // to the target intersects another poly
        // --
        // Note: walkAroundAPoly adds target to the end of the path when it is finished
        // --
        // Now keep iterative in the "direction" until we have a path that doesn't intersect with this polygon
        // and heads right for the target or intersects with another polygon:
        const _verticies = getPointsFromPolygonStartingAt(poly, startVertex);
        // If the direction is 'prev', walk in the opposite direction
        const verticies = direction == 'prev' ? _verticies.reverse() : _verticies;
        // As we walk,
        for (let vertex of verticies) {
            // const penultimatePoint = path.points[path.points.length - 2];
            // If this next vertex is closer to the penultimatePoint than the ultimatePoint, remove the ultimate point,
            // because there is a shorter path to the vertex than there is from the ultimatePoint to the vertex
            // if (penultimatePoint
            //     // if distance to the new vertex is shorter than the distance to the ultimate vertex
            //     && distance(penultimatePoint, path.points[path.points.length - 1]) > distance(penultimatePoint, vertex)
            //     // and if the line from the penultimatePoint to the new vertex is unobstructed...
            //     && getClosestIntersectionWithWalls({ p1: penultimatePoint, p2: vertex }, pathingWalls).closestIntersection == vertex) {
            //     // remove last point, because "vertex" has an unobstructed shorter path from the penultimate point
            //     path.points.splice(-1);
            // }

            // If the target point is on the line between the last point and this point, we've found the path and can exit.
            // This occurs if the target point lies directly on an edge of the current polygon
            if (isPointOnLineSegment(target, { p1: path.points[path.points.length - 1], p2: vertex })) {
                path.done = true
                break;
            }
            // Optimize, check if there's an unobstructed line between new vertex and penultimate point:
            // if (window.optimize == true && path.points.length >= 2) {
            //     let { closestIntersection } = getClosestIntersectionWithWalls({ p1: path.points[path.points.length - 2], p2: vertex }, pathingWalls, true);
            //     if (!closestIntersection || Vec.equal(closestIntersection, vertex)) {
            //         console.log('remove ultimate point');
            //         const ultimatePoint = path.points[path.points.length - 1];
            //         window.debugGraphics.lineStyle(1, 0xff0000, 1);
            //         window.debugGraphics.drawCircle(ultimatePoint.x, ultimatePoint.y, 4);
            //         // Remove ultimate point
            //         path.points.pop()
            //     }
            // }

            // Prevent paths from overlapping already existing paths:
            for (let otherPath of paths) {
                if (otherPath !== path) {
                    for (let point of otherPath.points) {
                        if (Vec.equal(vertex, point)) {
                            // Draw where path stopped
                            window.debugGraphics.lineStyle(1, 0x0000ff, 1);
                            window.debugGraphics.drawCircle(vertex.x, vertex.y, 4);
                            path.invalid = true;
                            path.done = true;
                            break;
                        }
                    }
                }
            }


            path.points.push(vertex);
            // Check if a straight line between the new vertex and the target collides with any walls
            const { intersectingWall, closestIntersection } = getClosestIntersectionWithWalls({ p1: vertex, p2: target }, pathingWalls);
            // If it does
            if (intersectingWall && closestIntersection) {
                // and the wall belongs to the current poly
                if (doesVertexBelongToPolygon(vertex, intersectingWall.polygon) && doesVertexBelongToPolygon(intersectingWall.p1, intersectingWall.polygon)) {
                    const indexOfVertex = intersectingWall.polygon.points.findIndex(p => Vec.equal(p, vertex));
                    // true if line to target doesn't pass through own polygon
                    let lineToTargetDoesNotPassThroughOwnPolygon = false;
                    if (indexOfVertex >= 0) {
                        lineToTargetDoesNotPassThroughOwnPolygon = doesLineFromPointToTargetProjectAwayFromOwnPolygon(intersectingWall.polygon, indexOfVertex, target);
                    }
                    // Line from vertex to the target is not cast through the inside angle of vertex and thus it is valid
                    // to branch
                    if (lineToTargetDoesNotPassThroughOwnPolygon) {
                        // A straight line from vertex to target intersects the same polygon again but is probably closer,
                        // so we'll branch off the new intersection point

                        // Exception: Don't branch off if it's branching into a polygonlinesegment that THIS path already contains
                        if (path.points.find(p => p == intersectingWall.p1) && path.points.find(p => p == intersectingWall.p2)) {
                            // Continue walking polygon
                            continue;
                        } else {
                            // Allowing jumping to intersecting wall
                            break;
                        }
                    } else {
                        // line cast to target DOES pass through the inside of this vertex's angle so it is invalid to branch.
                        // Thus, keep walking around the polygon
                        // Continue to check the next or previous (depending on direction) vertex for this poly
                        // we need to keep walking around it to continue the path
                        continue;
                    }
                } else {
                    // If it belongs to a different poly, then we can stop walking because
                    // we've walked the path as far around the current poly as we need to in order
                    // to continue pathing towards the target by walking a different poly
                    break;
                }
            } else {
                // Stop if there is no intersecting wall, the path is complete because it has reached the poly
                break;
            }

        }

        // Re add the last point to the end of the points (without changing the distance because it may be removed
        // temporarily to add intermediate points)
        path.points.push(target);

    }
    // Protect against infinite recursion
    if (recursionCount > 12) {
        console.error('couldnt find path in few enough steps', recursionCount, paths.map(p => p.points.length).sort());
        // Mark all unfinished path's as invalid because they did not find a valid path
        // in few enough steps
        for (let path of paths) {
            if (!path.done) {
                path.invalid = true;
            }
            path.done = true;

        }
    }

    tryAllPaths:
    for (let path of paths) {
        // Do not continue to process paths that are complete
        if (path.done) {
            continue;
        }
        if (path.invalid) {
            continue;
        }
        // A path must have at least 2 points (a start and and end) to be processed
        if (path.points.length < 2) {
            console.error("Path is too short to try", JSON.stringify(path.points.map(p => Vec.clone(p))));
            path.invalid = true;
            path.done = true;
            continue;
        }

        const nextStraightLine: LineSegment = getLastLineInPath(path);

        // Check for collisions between the last line in the path and pathing walls
        let { intersectingWall, closestIntersection } = getClosestIntersectionWithWalls(nextStraightLine, pathingWalls, path.points.length == 2);
        // If there is an intersection between a straight line path and a pathing wall
        // we have to branch the path to the corners of the wall and try again
        if (intersectingWall) {
            // Remove the last point in the path as we now need to add intermediate points.
            // This point will be readded to the path after the intermediate points are added:
            const target = path.points.splice(-1)[0]
            if (closestIntersection) {
                path.points.push(closestIntersection);
                // Before branching, check if another path already has this branch point,
                // find the shortest of the two paths and discard the other
                // for (let otherPath of paths) {
                //     if (otherPath !== path) {
                //         for (let point of otherPath.points) {
                //             if (Vec.equal(point, closestIntersection)) {
                //                 // Found competing path
                //                 if (otherPath.distance < path.distance) {
                //                     path.invalid = true;
                //                     path.done = true;
                //                     continue tryAllPaths;
                //                 } else {
                //                     otherPath.invalid = true;
                //                     otherPath.done = true;
                //                 }

                //             }

                //         }

                //     }

                // }

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
            walkAroundAPoly('prev', nextWalkPoint, intersectingWall.polygon, target, pathingWalls, path);
            // Starting from the "next" corner, walk around the poly until you can make a 
            // straight line to the target that doesn't intersect with this same poly
            walkAroundAPoly('next', nextWalkPoint, intersectingWall.polygon, target, pathingWalls, branchedPath);


            tryPaths(paths, pathingWalls, recursionCount + 1);

        } else {
            // If no intersections were found then we have a path to the target, so stop processing this path.
            // This is the "happy path", a straight line without collisions has been found to the target
            // and the path is complete

            // Mark the path as "done"
            path.done = true;
        }
    }

    calculateDistanceOfPaths(paths);
    // console.log('found valid paths paths', paths, 'done', paths.filter(p => p.done).length);
    // Debug: Draw the paths:
    for (let i = 0; i < paths.length; i++) {
        // Visual offset is useful for representing overlapping paths in a way where you can see
        // all of them
        const visualOffset = i * 3;
        const path = paths[i];
        if (path.invalid) {
            // Remove the target (the last point) to visually show it couldn't complete
            if (path.points.length > 2) {
                path.points.pop();
            }
            window.debugGraphics.lineStyle(4, 0xff0000, 0.1);
        } else {
            window.debugGraphics.lineStyle(4, 0x00ff00, 0.3);
        }
        window.debugGraphics.moveTo(path.points[0].x + visualOffset, path.points[0].y + visualOffset);
        for (let point of path.points) {
            window.debugGraphics.lineTo(point.x + visualOffset, point.y + visualOffset);
        }
    }
    // Remove invalid paths
    paths = paths.filter(p => !p.invalid);
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
    // if (shortestPath) {
    //     // returns true if fully optimized
    //     function tryOptimizePath(path: Path): boolean {
    //         for (let i = 0; i < path.points.length; i++) {
    //             for (let j = path.points.length - 1; j > i + 1; j--) {
    //                 let { intersectingWall } = getClosestIntersectionWithWalls({ p1: path.points[i], p2: path.points[j] }, pathingWalls);
    //                 if (!intersectingWall) {
    //                     window.debugGraphics.lineStyle(1, 0xff0000, 1);
    //                     window.debugGraphics.drawCircle(path.points[i].x, path.points[i].y, 4);
    //                     window.debugGraphics.lineStyle(1, 0x0000ff, 1);
    //                     window.debugGraphics.drawCircle(path.points[j].x, path.points[j].y, 4);
    //                     console.log('remove', i, ' to', j, 'from', path.points.length);
    //                     path.points = removeBetweenIndexAtoB(path.points, i, j);
    //                     return false

    //                 }
    //             }
    //         }
    //         return true;
    //     }
    //     let fullyOptimized = false;
    //     do {
    //         fullyOptimized = tryOptimizePath(shortestPath);
    //     } while (!fullyOptimized);
    // }
    // If there is an unobstructed straight line between two points, you can remove all the points in-between
    return shortestPath;
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
        path.distance = 0;
        // Finally, calculate the distance for the path 
        for (let i = 0; i < path.points.length - 2; i++) {
            path.distance += distance(path.points[i], path.points[i + 1]);
        }

    }
}
function polygonLineSegmentToPrevAndNext(wall: PolygonLineSegment): { prev: Vec2, next: Vec2 } {
    return { prev: wall.p1, next: wall.p2 };
}
function getLastLineInPath(path: Path): LineSegment {
    return { p1: path.points[path.points.length - 2], p2: path.points[path.points.length - 1] };

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
            // Since non-inverted polygons' walls count as INSIDE, inverted polygons' walls count as OUTSIDE
            // the polygon, so when the wall belongs to an inverted polygon, always ignore collisions at the
            // start of the line segment
            if (wall.polygon.inverted && Vec.equal(line.p1, intersection)) {
                // If the polygon is inverted, and the line is cast towards the inside (outside) from the 
                // inverted polygon, allow it
                const insideAngleOfWall = getInsideAnglesOfWall(wall);
                const lineIsCastIntoNoWalkZone = isAngleBetweenAngles(
                    Vec.getAngleBetweenVec2s(line.p1, line.p2), insideAngleOfWall.start, insideAngleOfWall.end
                );
                if (!lineIsCastIntoNoWalkZone) {
                    // Ignore the collision
                    continue
                }
            }
            if (!includeStartPoint && Vec.equal(line.p1, intersection)) {
                // Exclude collisions at start point of line segment. Don't collide with self
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
    return { intersectingWall, closestIntersection };
}