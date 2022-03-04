import type { Vec2, Polygon, Vertex } from "./commonTypes";
import * as vectorMath from './collision/vectorMath';
import { distance, similarTriangles } from "./math";
import { LineSegment, lineSegmentIntersection } from "./collision/collisionMath";
import { drawDryRunCircle } from "./ui/PlanningView";

export function lineSegmentsToVec2s(lineSegments: LineSegment[]): Vec2[] {
    return [lineSegments[0].p1, ...lineSegments.reduce<Vec2[]>((agg, cur) => {
        agg.push(cur.p2)
        return agg
    }, [])]

}
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
    const polygon: Polygon = { startVertex, length: points.length };

    return polygon;
}
// Note, if polygon is not updated correctly (it's length is not up to date with the
// linked list or the last element doesn't next to the first), this function
// will only return up to the nth == length point.
// Note: if you use customStartVertex it is imperative that the customStartVertex
// actually belongs to the polygon, or else it will iterate another polygon starting
// at customStartVertex for polygon.length iterations which will yield unusual and undesirable results
export function* makePolygonIterator(polygon: Polygon, customStartVertex?: Vertex): Generator<Vertex> {
    let current = customStartVertex || polygon.startVertex;
    for (let i = 0; i < polygon.length; i++) {
        yield current;
        current = current.next;
    }
}

export function getVerticies(polygon: Polygon): Vertex[] {
    let currentVertex = polygon.startVertex;
    let verticies: Vertex[] = [];
    let i = 0;
    do {
        verticies.push(currentVertex);
        currentVertex = currentVertex.next;
        i++;
        // Arbitrary stop to prevent infinite loop
        if (i > 1000) {
            console.error("Prevent infinite loop when running polygonToVec2s")
            break;
        }
    } while (polygon.startVertex != currentVertex);
    return verticies;
}
export function polygonToVec2s(polygon: Polygon): Vec2[] {
    return getVerticies(polygon).map(({ x, y }) => ({ x, y }));
}

// Similar to LineSegment but Verticies instead of Vec2s
export interface VertexLineSegment {
    p1: Vertex;
    p2: Vertex;
}
export function polygonToVertexLineSegments(polygon: Polygon): VertexLineSegment[] {
    const verticies = getVerticies(polygon);
    let lastPoint = verticies[0];
    let lineSegments: VertexLineSegment[] = [];
    for (let i = 1; i < verticies.length; i++) {
        lineSegments.push({ p1: lastPoint, p2: verticies[i] });
        lastPoint = verticies[i];
    }
    // Add line from last point to first point:
    lineSegments.push({ p1: lastPoint, p2: verticies[0] });
    return lineSegments;
}
// in radians
function getAngleBetweenVec2s(v1: Vec2, v2: Vec2): number {
    const dy = v2.y - v1.y;
    const dx = v2.x - v1.x;
    return Math.atan2(dy, dx);
}
// order matters
// angles are in radians
function getAngleBetweenAngles(anglePrev: number, angleNext: number): number {
    const angleBetween = (anglePrev > angleNext ? anglePrev : anglePrev + Math.PI * 2) - angleNext;
    return angleBetween
}

// Expand polygon: Grows a polygon into it's "outside" by the distance of magnitude
// along the normal vectors of each vertex.
// Uses the ordered verticies (from prev to next; running clockwise) to determine what is
// "inside" and what is "outside"
export function expandPolygon(polygon: Polygon, magnitude: number): Polygon {
    const vertices = getVerticies(polygon);
    // Batch adjustedPoints and then adjust them all at once
    const newPoints: Vec2[] = vertices.map(v => projectVertexAlongOutsideNormal(v, magnitude));
    return vec2sToPolygon(newPoints)
}
// Returns a Vec2 of the vertex's coordinate projected along it's normal on the 
// OUTSIDE side as specified by assuming that the outside is the angle from
// vertex.prev to vertex.next
function projectVertexAlongOutsideNormal(vertex: Vertex, magnitude: number): Vec2 {
    // Find a point along the normal:
    const projectToPoint = { x: vertex.x, y: vertex.y };
    const dxPrev = vertex.x - vertex.prev.x;
    const dyPrev = vertex.y - vertex.prev.y;
    projectToPoint.x -= dxPrev;
    projectToPoint.y -= dyPrev;
    const dxNext = vertex.x - vertex.next.x;
    const dyNext = vertex.y - vertex.next.y;
    projectToPoint.x -= dxNext;
    projectToPoint.y -= dyNext;

    // Find out if the angle is inverted based on the order of prev and next verticiees
    const anglePrev = getAngleBetweenVec2s(vertex, vertex.prev);
    const angleNext = getAngleBetweenVec2s(vertex, vertex.next);
    const angleBetween = getAngleBetweenAngles(anglePrev, angleNext);
    const isInverted = angleBetween <= Math.PI / 2;
    // Find the point magnitude away from vertex along the normal
    const X = projectToPoint.x - vertex.x;
    const Y = projectToPoint.y - vertex.y;
    const D = distance(projectToPoint, vertex);
    const d = isInverted ? -magnitude : magnitude;
    const relativeAdjustedPoint = similarTriangles(X, Y, D, d);
    return vectorMath.subtract(vertex, relativeAdjustedPoint);
}

// The rule: inside points get removed, intersections become new points
export function mergeOverlappingPolygons(polygons: Polygon[]): Polygon[] {
    const resultPolys: Polygon[] = [];
    const excludePolyAtIndex = new Set();
    top:
    for (let pi = 0; pi < polygons.length; pi++) {
        if (excludePolyAtIndex.has(pi)) {
            continue;
        }
        const polygon = polygons[pi];
        const batchReplaceInstructions: { pi?: number, pj?: number, first?: { originalPolyVert: Vertex, intersectionVert: Vertex }, second?: { originalPolyVert: Vertex, intersectionVert: Vertex } } = {};
        // console.log('jtest1', vls);
        // For all other polygons
        for (let pj = 0; pj < polygons.length; pj++) {
            if (excludePolyAtIndex.has(pj)) {
                continue;
            }
            const otherPoly = polygons[pj];
            // for (let otherPoly of polygons) {
            if (otherPoly == polygon) {
                // "other polygons" meaning... don't test for intersections against self
                continue;
            }
            for (let vls of polygonToVertexLineSegments(polygon)) {
                // Test for intersection with all of the other polygon's vertex line segments
                for (let otherVls of polygonToVertexLineSegments(otherPoly)) {
                    const intersection = lineSegmentIntersection(vls, otherVls);
                    if (intersection) {
                        // Since an intersection was found, remove both polys and 
                        // create a new poly from their merger 
                        const { next, prev } = getPrevAndNextCornersFromIntersectingWall(vls);
                        const { next: otherVlsNext, prev: otherVlsPrev } = getPrevAndNextCornersFromIntersectingWall(otherVls)
                        // This will only trigger for the poly that has points inside
                        // of the other poly, because that is the one that needs to be processed
                        // later by batchReplaceInstructions
                        if (isVec2InsidePolygon(next, otherPoly)) {
                            batchReplaceInstructions.pi = pi;
                            batchReplaceInstructions.pj = pj;
                            // Make a new vertex from the intersection that
                            // merges the two intersecting polys
                            // prev.next = { ...intersection, prev, next: otherVlsNext };
                            batchReplaceInstructions.first = {
                                originalPolyVert: prev,
                                intersectionVert: { ...intersection, prev, next: otherVlsNext }
                            }

                        } else if (isVec2InsidePolygon(prev, otherPoly)) {
                            batchReplaceInstructions.pi = pi;
                            batchReplaceInstructions.pj = pj;
                            // Make a new vertex from the intersection that
                            // merges the two intersecting polys
                            // next.prev = { ...intersection, prev: otherVlsPrev, next };
                            batchReplaceInstructions.second = {
                                originalPolyVert: next,
                                intersectionVert: { ...intersection, prev: otherVlsPrev, next }
                            };
                            break;

                        }
                    }

                }
                if (batchReplaceInstructions.first && batchReplaceInstructions.second) {
                    // Now that we found 2 intersections, both of these polygons can be
                    // excluded and we now create a new one
                    excludePolyAtIndex.add(batchReplaceInstructions.pi);
                    excludePolyAtIndex.add(batchReplaceInstructions.pj);
                    // Make the new polygon
                    const vec2s: Vec2[] = [batchReplaceInstructions.first.intersectionVert];
                    // Start at batchReplaceInstructions.first and iterate the otherPoly all the way
                    // then add batchReplaceInstructions.second, and iterate poly
                    for (let vert of makePolygonIterator(otherPoly, batchReplaceInstructions.first.intersectionVert.next)) {
                        vec2s.push(vert);
                        if (vectorMath.equal(vert, batchReplaceInstructions.second.intersectionVert.prev)) {
                            // Stop if / once we reach the vert right before the second intersection

                            break;
                        }
                    }
                    vec2s.push(batchReplaceInstructions.second.intersectionVert);
                    for (let vert of makePolygonIterator(polygon, batchReplaceInstructions.second.intersectionVert.next)) {
                        vec2s.push(vert);
                        // Stop once we reach the vert right before batchReplaceInstructions.first.next
                        // This will exclude the polygon verticies that are inside of otherPolygon
                        if (vectorMath.equal(vert, batchReplaceInstructions.first.originalPolyVert)) {
                            break;
                        }
                    }
                    polygons.push(vec2sToPolygon(vec2s));
                    continue top;
                }

            }
        }
    }
    for (let pi = 0; pi < polygons.length; pi++) {
        if (!excludePolyAtIndex.has(pi)) {
            resultPolys.push(polygons[pi]);
        }
    }
    return resultPolys;
    // --
    // Okay so this is how you determine the points to remove.  There will always be at least 2 intersections if
    // the polys intersect.  So once you find an intersection, start iterating next along the polygon... if the
    // next vertex is INSIDE the other poly, keep going (removing the inside ones as you go) until you reach the other
    // intersection.  If the next vertex is NOT inside, iterate until you find the next intersection then do the above
    // logic of iterating and removing the inside ones

}

function isVec2InsidePolygon(point: Vec2, polygon: Polygon): boolean {
    // From geeksforgeeks.com: 
    // 1) Draw a horizontal line to the right of each point and extend it to infinity 
    // 2) Count the number of times the line intersects with polygon edges. 
    // 3) A point is inside the polygon if either count of intersections is odd or point lies on an edge of polygon. 
    // If none of the conditions is true, then point lies outside
    const testLine: LineSegment = { p1: point, p2: { x: Number.MAX_SAFE_INTEGER, y: point.y } };
    const intersections: Vec2[] = [];
    for (let vertexLineSegment of polygonToVertexLineSegments(polygon)) {
        const intersection = lineSegmentIntersection(testLine, vertexLineSegment)
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
    return intersections.length % 2 != 0;

}

export const testables = {
    expandPolygon,
    projectVertexAlongOutsideNormal,
    getAngleBetweenAngles,
    isVec2InsidePolygon,
}

export function findPath(startPoint: Vec2, target: Vec2, pathingWalls: VertexLineSegment[]): Vec2[] {
    const paths: Path[] = [
        // Start with the first idea path from start to target
        // Note, the distance is calculated inside of tryPaths even if 
        // there are no interruptions to the path and it just goes from startPoint
        // to target.
        { done: false, invalid: false, points: [startPoint, target], distance: 0 }
    ];
    console.log('BEGIN ------------');
    tryPaths(paths, pathingWalls, 0);
    console.log('paths', paths);
    return paths.sort((a, b) => a.distance - b.distance)[0].points
}
// Mutates the paths array's objects
function tryPaths(paths: Path[], pathingWalls: VertexLineSegment[], recursionCount: number) {
    console.log('try paths', JSON.stringify(paths.map(p => ({ ...p, points: p.points.map(pn => ({ x: pn.x, y: pn.y })) })), null, 2));
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
            path.invalid = true;
            continue;
        }
        const nextStraightLine: LineSegment = getLastLineInPath(path);

        // Debug draw nextStraightLine
        // window.underworld.debugGraphics.lineStyle(3, 0x00ff00, 1);
        // window.underworld.debugGraphics.moveTo(nextStraightLine.p1.x, nextStraightLine.p1.y);
        // window.underworld.debugGraphics.lineTo(nextStraightLine.p2.x, nextStraightLine.p2.y);

        // Check for collisions between the last line in the path and pathing walls
        let intersectingWall = getClosestIntersectionWithWalls(nextStraightLine, pathingWalls);
        // If there is an intersection between a straight line path and a pathing wall
        // we have to branch the path to the corners of the wall and try again
        if (intersectingWall) {
            let { prev, next } = getPrevAndNextCornersFromIntersectingWall(intersectingWall);
            console.log('Branch on prev,next', nextStraightLine, prev, next);
            // Remove the last point in the path as we now need to add intermediate points.
            // This point will be readded to the path after the intermediate points are added:
            const target = path.points.splice(-1)[0]

            // Branch the path.  The original path will try navigating around p1
            // and the branchedPath will try navigating around p2.
            // Note: branchedPath must be cloned before path's p2 is modified
            const branchedPath = { ...path, points: path.points.map(p => vectorMath.clone(p)) };
            paths.push(branchedPath);

            dive('prev', prev, next, target, pathingWalls, path);
            dive('next', next, prev, target, pathingWalls, branchedPath);


            tryPaths(paths, pathingWalls, recursionCount + 1);

        } else {
            console.log('end path');
            // This is the "happy path", a straight line without collisions has been found to the target
            // and the path is complete

            // Debug: Draw all the paths:
            const colors = [
                0xff0000,
                0x00ff00,
                0x0000ff,
                0xffffff,
            ]
            for (let i = 0; i < paths.length; i++) {
                const path = paths[i];
                window.underworld.debugGraphics.lineStyle(4, colors[i], 0.3);
                window.underworld.debugGraphics.moveTo(path.points[0].x, path.points[0].y);
                for (let point of path.points) {
                    window.underworld.debugGraphics.lineTo(point.x, point.y);
                }
            }
            // Finally, add the final distance from the penultimate point to the final point
            path.distance += distance(path.points[path.points.length - 2], path.points[path.points.length - 1]);
            // If no intersections were found then we have a path to the target, so stop processing this path:
            path.done = true;
        }
    }
}
function dive(direction: 'prev' | 'next', vertexInDirection: Vertex, vertexInOtherDirection: Vertex, target: Vec2, pathingWalls: VertexLineSegment[], path: Path) {
    // Add the wall's "direction" corner as a new point to path to
    addPointToPath(path, vertexInDirection);
    // Now keep iterative in the "prev" direction until we have a path that doesn't intersect with this polygon
    // and heads right for the target or intersects with another polygon:
    do {
        console.log('dive', direction)
        const prevIntersectingWall = getClosestIntersectionWithWalls({ p1: vertexInDirection, p2: target }, pathingWalls);
        if (prevIntersectingWall) {
            if (verticiesBelongToSamePoly(vertexInDirection, prevIntersectingWall.p1)) {
                addPointToPath(path, vertexInDirection[direction]);
                vertexInDirection = vertexInDirection[direction];
            } else {
                break;

            }
        } else {
            // Stop if there is no intersecting wall
            break;
        }
        // Stop if we make it all the way around the poly
    } while (vertexInDirection != vertexInOtherDirection);
    console.log('done diving', direction)
    // Re add the last point to the end of the points (without changing the distance because it may be removed
    // temporarily to add intermediate points)
    path.points.push(target);

}

// Given a VertexLineSegment, return the vertexes in the orientation of previous and next
// Vertexes always have a clockwise orientation that determines if the polygon that they make up is
// an internal polygon or an external polygon.  This function reveals the orientation of the Verticies
// that make up the VertexLineSegment.
// Useful for pathing to know which direction to add corners to a path after a collision is detected.
function getPrevAndNextCornersFromIntersectingWall(wall: VertexLineSegment): { prev: Vertex, next: Vertex } {
    if (wall.p1.prev == wall.p2) {
        return { prev: wall.p2, next: wall.p1 }
    } else {
        return { prev: wall.p1, next: wall.p2 }
    }
}
function getLastLineInPath(path: Path): LineSegment {
    return { p1: path.points[path.points.length - 2], p2: path.points[path.points.length - 1] };

}
// Note: Mutates path
function addPointToPath(path: Path, newPoint: Vec2) {
    path.points.push(newPoint);
    path.distance += distance(path.points[path.points.length - 2], path.points[path.points.length - 1]);
}
function verticiesBelongToSamePoly(v1: Vertex, v2: Vertex): boolean {
    const limit = 100;
    let verticiesIterated = 0;
    let next = v1.next;
    while (next != v1) {
        if (next == v2) {
            return true
        }
        next = next.next;
        // Protect against infinite loop
        // This should never happen because all Poly's are closed
        verticiesIterated++;
        if (verticiesIterated >= limit) {
            console.error('Poly limit reached in verticiesBelongToSamePoly');
            break;
        }
    }
    return false;

}
// Given an array of VertexLineSegments[], of all the intersections between line and the walls,
// find the closest intersection to line.p1
function getClosestIntersectionWithWalls(line: LineSegment, walls: VertexLineSegment[]): VertexLineSegment | undefined {
    let intersectingWall;
    let closestIntersection;
    let closestIntersectionDistance;
    // Check for collisions between the last line in the path and pathing walls
    for (let wall of walls) {
        const intersection = lineSegmentIntersection(line, wall);
        if (intersection) {
            if (vectorMath.equal(line.p1, intersection)) {
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
    return intersectingWall ? intersectingWall : undefined
}
interface Path {
    done: boolean;
    // A invalid path does not path to the target and can be ignored
    invalid: boolean;
    points: Vec2[];
    // The distance that the full path traverses
    distance: number;
}

// In order to pathfind, I need a non-intersecting convex polygon mesh.

// The corner cases include walls that overlap, and expands that overlap.

// How to solve:
// 0. Start with collidable walls as Polygons (the Polygon interface is designed so it is clear what is inside the polygon and what is outside.  For example, the outer bounds of the game world is kind of an inverted polygon like the inside of a box is spacious and the entire outside is solid. Whereas obstacles are regular polygons where the inside is solid (you can't move through it) and the outside
// is spacious and available for movement.  So inverted polygons can be expressed by the direction of prev and next in it's verticies.
// --
// Takes an array of Polygons and transforms them into a fully connected convex poly mesh
// export function generateConvexPolygonMesh(polys: Polygon[], expandSize: number): Polygon[] {
//     // 1. Grow the polygons according to `expand`.  Expand is used to give a margin to the pathing mesh so that units with thickness won't clip through walls as they pass by the corners or through a narrow area.
//     const expandedPolygons = polys.map(p => expandPolygon(p, expandSize));
//     // 2. Merge parts of intersecting or overlapping polygons so that none of them intersect or overlap.  This step is important, for example if there is a very thin corridor and the expand is large enough, no space in the corridor will be pathable and this is because the collidable polygons will grow so much (due to the expand) that they will overlap.
//     // TODO: Left off here
//     // 3. Take the world bounds (the inverted polygon I mentioned before) and all the collidable polygons and make more connections between their verticies so that there are no concave polygons. This step will return a new array of polygons (probably 3-sided).
//     // This is currently done inside of split
//     // 4.  Optimize the new array of polygons so that multiple polygons are combined if the unified polygon remains convex.
//     // This is currently done inside of split but should be redone to use polygons instead of Points
//     // 5.  Give polygons references to their neighbors (a neighboring polygon is any polygon that shares an edge
//     // 6. Use this array of polygons and their neighbors via an A* algorithm or something similar to pathfind.
// }