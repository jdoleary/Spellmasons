import type { Vec2, Polygon, Vertex } from "./commonTypes";
import * as vectorMath from './collision/vectorMath';
import { distance, similarTriangles } from "./math";
import { LineSegment, lineSegmentIntersection } from "./collision/collisionMath";

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
    const polygon: Polygon = { startVertex };

    return polygon;
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
export function polygonToLineSegments(polygon: Polygon): LineSegment[] {
    const points = polygonToVec2s(polygon);
    let lastPoint = points[0];
    let lineSegments: LineSegment[] = [];
    for (let i = 1; i < points.length; i++) {
        lineSegments.push({ p1: lastPoint, p2: points[i] });
        lastPoint = points[i];
    }
    // Add line from last point to first point:
    lineSegments.push({ p1: lastPoint, p2: points[0] });
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
// function mergeOverlappingPolygons(polygons: Polygon[]): Polygon[] {
//     // TODO: LEFT OFF: implement

// }

export const testables = {
    expandPolygon,
    projectVertexAlongOutsideNormal,
    getAngleBetweenAngles,
    // mergeOverlappingPolygons,
}

export function findPath(startPoint: Vec2, target: Vec2, pathingWalls: LineSegment[]): Vec2[] {
    const potentialPaths: Path[] = [
        [{ p1: startPoint, p2: target }]
    ];
    return lineSegmentsToVec2s(tryPaths(potentialPaths, pathingWalls, 0));
}
function tryPaths(paths: Path[], pathingWalls: LineSegment[], recursionCount: number): Path {
    // Protect against infinite recursion
    if (recursionCount > 2) {
        console.error('couldnt find path in few enough steps', recursionCount);
        // Default to the first path since a complete path couldn't be found
        return paths[0]
    }
    // TODO:
    // Deal with not drawing a next path line through the inside of an obstacle

    for (let path of paths) {
        const nextStraightLinePath = path[path.length - 1];
        const target = nextStraightLinePath.p2;
        let intersectingWall;
        let closestIntersection;
        let closestIntersectionDistance;
        for (let wall of pathingWalls) {
            const intersection = lineSegmentIntersection(nextStraightLinePath, wall);
            if (intersection) {
                if (vectorMath.equal(nextStraightLinePath.p1, intersection)) {
                    // Exclude collisions with start point of line segment. 
                    continue;
                }
                const dist = distance(nextStraightLinePath.p1, intersection);
                // If there is no closest intersection, make this intersection the closest intersection
                // If there is and this intersection is closer, make it the closest
                if (!closestIntersection || (closestIntersection && closestIntersectionDistance && closestIntersectionDistance > dist)) {
                    closestIntersection = intersection;
                    closestIntersectionDistance = dist;
                    intersectingWall = wall
                }

            }
        }
        // If there is an intersection between a straight line path and a pathing wall
        // we have to branch the path to the corners of the wall and try again
        if (closestIntersection && intersectingWall) {
            window.underworld.debugGraphics.drawCircle(closestIntersection.x, closestIntersection.y, 7);
            // Branch the path.  The original path will try navigating around p1
            // and the branchedPath will try navigating around p2.
            // Note: branchedPath must be cloned before path's p2 is modified
            const branchedPath = deepClonePath(path)
            paths.push(branchedPath);

            // Add the wall's p1 corner as a point in the path
            path[path.length - 1].p2 = intersectingWall.p1;
            path.push({ p1: intersectingWall.p1, p2: target });

            // Start another path with the wall's p2 corner as the next point in the path
            branchedPath[branchedPath.length - 1].p2 = intersectingWall.p2;
            branchedPath.push({ p1: intersectingWall.p2, p2: target });

            return tryPaths(paths, pathingWalls, ++recursionCount);

        } else {
            // If no intersections were found then we have a path to the target, return that path:
            // Draw all the paths:
            window.underworld.debugGraphics.lineStyle(8, 0xaa0000, 1);
            for (let path of paths) {
                for (let lineSegment of path) {
                    window.underworld.debugGraphics.moveTo(lineSegment.p1.x, lineSegment.p1.y);
                    window.underworld.debugGraphics.lineTo(lineSegment.p2.x, lineSegment.p2.y);
                }
            }
            console.log(`Found ${paths.length} valid paths`);
            return path;
        }
    }

    // This should be unreachable since the for loop with return, return path at index 0 as default
    return paths[0];
}
type Path = LineSegment[];

function deepClonePath(path: Path): Path {
    return path.map(l => ({ p1: vectorMath.clone(l.p1), p2: vectorMath.clone(l.p2) }))
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