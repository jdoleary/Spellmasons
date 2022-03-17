import { LineSegment, lineSegmentIntersection } from "./collision/collisionMath";
import { distance } from "./math";
import { getPointsFromPolygonStartingAt, doesVertexBelongToPolygon, Polygon, PolygonLineSegment, polygonToPolygonLineSegments, isVec2InsidePolygon } from "./Polygon";
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
        window.underworld.debugGraphics.lineStyle(4, 0xffffff, 0.3);
        window.underworld.debugGraphics.moveTo(shortestPath.points[0].x, shortestPath.points[0].y);
        for (let point of shortestPath.points) {
            window.underworld.debugGraphics.lineTo(point.x, point.y);
        }
        // Remove the start point, since the unit doing the pathing is already at the start point:
        shortestPath.points.shift();
        // IF the last point is inside of a polygon remove it, and so the unit pathing will move as close as they can
        if (polygons.some(p => isVec2InsidePolygon(shortestPath.points[shortestPath.points.length - 1], p))) {
            shortestPath.points.pop();
        }
    }
    return shortestPath ? shortestPath.points : [];
}
// Mutates the paths array's objects
function tryPaths(paths: Path[], pathingWalls: PolygonLineSegment[], recursionCount: number): Path | undefined {
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
            const penultimatePoint = path.points[path.points.length - 2];
            // If this next vertex is closer to the penultimatePoint than the ultimatePoint, remove the ultimate point,
            // because there is a shorter path to the vertex than there is from the ultimatePoint to the vertex
            if (penultimatePoint
                // if distance to the new vertex is shorter than the distance to the ultimate vertex
                && distance(penultimatePoint, path.points[path.points.length - 1]) > distance(penultimatePoint, vertex)
                // and if the line from the penultimatePoint to the new vertex is unobstructed...
                && getClosestIntersectionWithWalls({ p1: penultimatePoint, p2: vertex }, pathingWalls).closestIntersection == vertex) {
                // remove last point, because "vertex" has an unobstructed shorter path from the penultimate point
                path.points.splice(-1);
            }
            path.points.push(vertex);
            // Check if a straight line between the new vertex and the target collides with any walls
            const { intersectingWall } = getClosestIntersectionWithWalls({ p1: vertex, p2: target }, pathingWalls);
            // If it does
            if (intersectingWall) {
                // and the wall belongs to the current poly
                if (doesVertexBelongToPolygon(vertex, intersectingWall.polygon) && doesVertexBelongToPolygon(intersectingWall.p1, intersectingWall.polygon)) {
                    // Continue to check the next or previous (depending on direction) vertex for this poly
                    // we need to keep walking around it to continue the path
                    continue;
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
    if (recursionCount > 7) {
        console.error('couldnt find path in few enough steps', recursionCount);
        // Mark all unfinished path's as invalid because they did not find a valid path
        // in few enough steps
        for (let path of paths) {
            if (!path.done) {
                path.invalid = true;
            }
            path.done = true;

        }
    }

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

        // Debug draw nextStraightLine
        // window.underworld.debugGraphics.lineStyle(3, 0x00ff00, 1);
        // window.underworld.debugGraphics.moveTo(nextStraightLine.p1.x, nextStraightLine.p1.y);
        // window.underworld.debugGraphics.lineTo(nextStraightLine.p2.x, nextStraightLine.p2.y);

        // Check for collisions between the last line in the path and pathing walls
        let { intersectingWall, closestIntersection } = getClosestIntersectionWithWalls(nextStraightLine, pathingWalls);
        // If there is an intersection between a straight line path and a pathing wall
        // we have to branch the path to the corners of the wall and try again
        if (intersectingWall) {
            // Remove the last point in the path as we now need to add intermediate points.
            // This point will be readded to the path after the intermediate points are added:
            const target = path.points.splice(-1)[0]
            if (closestIntersection) {
                path.points.push(closestIntersection);
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
    // returns true if fully optimized
    // function tryOptimizePath(path: Path): boolean {
    //     for (let i = 0; i < path.points.length; i++) {
    //         for (let j = path.points.length - 1; j > i + 1; j--) {
    //             let { intersectingWall } = getClosestIntersectionWithWalls({ p1: path.points[i], p2: path.points[j] }, pathingWalls);
    //             if (!intersectingWall) {
    //                 window.underworld.debugGraphics.lineStyle(1, 0xff0000, 1);
    //                 window.underworld.debugGraphics.drawCircle(path.points[i].x, path.points[i].y, 4);
    //                 window.underworld.debugGraphics.lineStyle(1, 0x0000ff, 1);
    //                 window.underworld.debugGraphics.drawCircle(path.points[j].x, path.points[j].y, 4);
    //                 console.log('remove', i, ' to', j, 'from', path.points.length);
    //                 path.points = removeBetweenIndexAtoB(path.points, i, j);
    //                 return false

    //             }
    //         }
    //     }
    //     return true;
    // }
    // for (let path of paths) {
    //     let fullyOptimized = false;
    //     do {
    //         fullyOptimized = tryOptimizePath(path);
    //     } while (!fullyOptimized);
    // }
    // If there is an unobstructed straight line between two points, you can remove all the points in-between

    // Calculate the distance for all paths
    for (let path of paths) {
        path.distance = 0;
        // Finally, calculate the distance for the path 
        for (let i = 0; i < path.points.length - 2; i++) {
            path.distance += distance(path.points[i], path.points[i + 1]);
        }

    }
    // console.log('found valid paths paths', paths, 'done', paths.filter(p => p.done).length);
    // // Debug: Draw the paths:
    // for (let i = 0; i < paths.length; i++) {
    //     const path = paths[i];
    //     if (path.invalid) {
    //         window.underworld.debugGraphics.lineStyle(4, 0xff0000, 0.3);
    //     } else {
    //         window.underworld.debugGraphics.lineStyle(4, 0x00ff00, 0.3);
    //     }
    //     window.underworld.debugGraphics.moveTo(path.points[0].x, path.points[0].y);
    //     for (let point of path.points) {
    //         window.underworld.debugGraphics.lineTo(point.x, point.y);
    //     }
    // }
    // Remove invalid paths
    paths = paths.filter(p => !p.invalid);
    return paths.reduce<Path | undefined>((shortest, contender) => {
        if (shortest === undefined) {
            return contender
        } else {
            if (shortest.distance > contender.distance) {
                return contender;
            } else {
                return shortest
            }
        }
    }, undefined)
}
export function removeBetweenIndexAtoB(array: any[], indexA: number, indexB: number): any[] {
    // indexA must be < indexB, if invalid args are passed in, return the values of the array
    if (indexA >= indexB) {
        return [...array];
    }
    return [...array.slice(0, indexA + 1), ...array.slice(indexB)]
}
function polygonLineSegmentToPrevAndNext(wall: PolygonLineSegment): { prev: Vec2, next: Vec2 } {
    return { prev: wall.p1, next: wall.p2 };
}
function getLastLineInPath(path: Path): LineSegment {
    return { p1: path.points[path.points.length - 2], p2: path.points[path.points.length - 1] };

}
// Given an array of PolygonLineSegment[], of all the intersections between line and the walls,
// find the closest intersection to line.p1
function getClosestIntersectionWithWalls(line: LineSegment, walls: PolygonLineSegment[]): { intersectingWall?: PolygonLineSegment, closestIntersection?: Vec2 } {
    let intersectingWall;
    let closestIntersection;
    let closestIntersectionDistance;
    // Check for collisions between the last line in the path and pathing walls
    for (let wall of walls) {
        const intersection = lineSegmentIntersection(line, wall);
        if (intersection) {
            if (Vec.equal(line.p1, intersection)) {
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