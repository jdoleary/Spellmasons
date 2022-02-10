import type { LineSegment } from "./collision/collisionMath";
import type { Vec2 } from "./commonTypes";

// How pathfinding works:
// 1. You start with an array of line sgments (walls) that cannot be moved through
// 2. The lineSegment[] is converted into Point[]
// 3. Point[] is converted into a ConvexPolygonMesh (Polygon[]).  This is the pathing mesh
// and must be updated every time a line segment changes
// 4. When a unit wants to path, they use findPath and follow that path that is returned.

export interface Polygon {
    points: Vec2[];
    neighbors: Polygon[];
    isConvex: boolean;
}
// Point consists of a "hub" (a Vec2 in coordinate space) as well as
// other Vec2's that the hub is connected to via a wall.
// For example:
//  A corner of a wall converted to a Point would be
//  { hub: the corner's coordinates, connections: [wall end, other wall end]}
//  This could look like a capital "L"
export interface Point {
    hub: Vec2;
    connections: Vec2[];
}
function findConnectionsToHub(hub: Vec2, lineSegmentEnd: Vec2, lineSegments: LineSegment[]): Point {
    const point: Point = { hub, connections: [lineSegmentEnd] };
    for (let otherSegment of lineSegments) {
        if ((hub == otherSegment.p1 && lineSegmentEnd == otherSegment.p2) || (hub == otherSegment.p2 && lineSegmentEnd == otherSegment.p1)) {
            // Do not process the same segment or else you'll get bad results
            // because of course the points will be identical because they are
            // in the same segment
            continue;
        }
        // Find connections to p1:
        if (otherSegment.p1 == hub) {
            // If p1 is the same as hub, then p2 is a connection
            point.connections.push(otherSegment.p2);
        }
        if (otherSegment.p2 == hub) {
            // If p2 is the same as hub, then p1 is a connection
            point.connections.push(otherSegment.p1);
        }

    }
    // Order connections by angle to hub
    // Note: Angles must be normalized
    point.connections.sort((a, b) => { return normalizeAngle(getAngleBetweenVec2s(point.hub, a)) - normalizeAngle(getAngleBetweenVec2s(point.hub, b)) })
    return point;
}

function lineSegmentsToPoints(lineSegments: LineSegment[]): Point[] {
    const points: Point[] = [];
    for (let segment of lineSegments) {
        const { p1, p2 } = segment;
        // Do not generate a point for a hub that has already been processed
        if (!points.find(p => p.hub == p1)) {
            points.push(findConnectionsToHub(p1, p2, lineSegments));
        }
        if (!points.find(p => p.hub == p2)) {
            points.push(findConnectionsToHub(p2, p1, lineSegments));
        }
    }
    return points;
}
// in radians
function getAngleBetweenVec2s(v1: Vec2, v2: Vec2): number {
    const dy = v2.y - v1.y;
    const dx = v2.x - v1.x;
    return Math.atan2(dy, dx);
}

// returns the angle between [0, Math.PI*2)
function normalizeAngle(radians: number): number {
    const n1 = radians % (Math.PI * 2);
    if (n1 < 0) {
        return n1 + Math.PI * 2;
    } else {
        return n1;

    }
}

// Returns true if angle1 is between angle 2 and 3
function isAngleBetweenAngles(angle1: number, angle2: number, angle3: number): boolean {
    // TODO LEFT OFF, At which point do I normalize angles
    const normalizedAngle1 = normalizeAngle(angle1);
    const normalizedAngle2 = normalizeAngle(angle2);
    const normalizedAngle3 = normalizeAngle(angle3);
    // const adjustedAngle2 = normalizedAngle2 > normalizedAngle3
    //     ? normalizedAngle2 - Math.PI * 2
    //     : normalizedAngle2;
    // console.log("jtest", adjustedAngle2 * 180 / Math.PI, normalizedAngle1 * 180 / Math.PI, normalizedAngle3 * 180 / Math.PI);
    // return normalizedAngle1 > adjustedAngle2 && normalizedAngle1 < normalizedAngle3;
    console.log("jtest", normalizedAngle2 * 180 / Math.PI, normalizedAngle1 * 180 / Math.PI, normalizedAngle3 * 180 / Math.PI);
    return normalizedAngle1 > normalizedAngle2 && normalizedAngle1 < normalizedAngle3;
}

// If a points connections are at an angle > 180 degrees, it will make a new connection
// in between that angle so all connections are at angles <= 180 degrees.
// This function is used for turning concave Polygons into convex polygons
// Mutates: point
function split(point: Point, allPoints: Point[]) {
    const { hub, connections } = point;
    for (let i = 0; i < connections.length; i++) {
        const currentVec2 = connections[0];
        const nextVec2Index = i + 1 >= connections.length ? 0 : i + 1;
        const nextVec2 = connections[nextVec2Index];
        const angle1 = getAngleBetweenVec2s(hub, currentVec2);
        const angle2 = getAngleBetweenVec2s(hub, nextVec2);
        console.log('jtest', currentVec2, angle1, nextVec2, angle2);
        const angleBetweenConnections = angle1 + angle2;
        if (angleBetweenConnections > Math.PI) {
            // Connections must be split
            // TODO greedy: Prefer the biggest split
            // TODO: Get angles between hub and all other points that don't cause
            // an intersection and take the biggest angle
            for (let otherPoint of allPoints) {
                const angle = getAngleBetweenVec2s(hub, otherPoint.hub);
                if (isAngleBetweenAngles(angle, angle1, angle2)) {
                } else {
                    // Do not consider this point because making a connection wouldn't split the angle
                }
            }
        }

    }
}
export const testables = {
    split,
    lineSegmentsToPoints,
    getAngleBetweenVec2s,
    isAngleBetweenAngles,
    normalizeAngle
}
// Takes an array of points and turns them into an array of convex polygons for pathfinding.
// insetSize is the distance that the points of the mesh should be away from the "points".
// insetSize is necessary for entities with a non-zero radius to path using a mesh without
// running into walls.  Without it, they may try to take a path that they could not fit
// through.
export function generateConvexPolygonMesh(points: Point[], insetSize: number): Polygon[] {
    return [];
}

export function findPath(from: Vec2, to: Vec2, mesh: Polygon[]): Vec2[] {
    return [];
}