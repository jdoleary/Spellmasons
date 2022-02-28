import { LineSegment, lineSegmentIntersection } from "./collision/collisionMath";
import type { Vec2 } from "./commonTypes";
import * as vectorMath from './collision/vectorMath';
import { distance, similarTriangles } from "./math";

const TO_DEG = 180 / Math.PI;
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

// Called by lineSegmentToPoints
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
        if (vectorMath.equal(otherSegment.p1, hub)) {
            // If p1 is the same as hub, then p2 is a connection
            point.connections.push(otherSegment.p2);
        }
        if (vectorMath.equal(otherSegment.p2, hub)) {
            // If p2 is the same as hub, then p1 is a connection
            point.connections.push(otherSegment.p1);
        }

    }
    sortConnectionsByAngle(point);
    return point;
}

// Order connections by angle to hub
// Note: Angles must be normalized
// mutates point
function sortConnectionsByAngle(point: Point) {
    point.connections = point.connections.sort((a, b) => { return normalizeAngle(getAngleBetweenVec2s(point.hub, a)) - normalizeAngle(getAngleBetweenVec2s(point.hub, b)) })
}


function lineSegmentsToPoints(lineSegments: LineSegment[]): Point[] {
    const points: Point[] = [];
    for (let segment of lineSegments) {
        const { p1, p2 } = segment;
        // Do not generate a point for a hub that has already been processed
        if (!points.find(p => vectorMath.equal(p.hub, p1))) {
            points.push(findConnectionsToHub(p1, p2, lineSegments));
        }
        if (!points.find(p => vectorMath.equal(p.hub, p2))) {
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

// returns the angle between (-Math.PI, Math.PI]
function normalizeAngle(radians: number): number {
    const n1 = radians % (Math.PI * 2);
    if (n1 <= -Math.PI) {
        return n1 + Math.PI * 2;
    } else {
        return n1;

    }
}

// Returns true if angle1 is between angle 2 and 3
function isAngleBetweenAngles(angle1: number, angle2: number, angle3: number): boolean {
    const from2To1 = counterClockwiseAngle(angle2, angle1);
    const from2To3 = counterClockwiseAngle(angle2, angle3);
    return from2To1 < from2To3;
}

// If a points connections are at an angle > 180 degrees, it will make a new connection
// in between that angle so all connections are at angles <= 180 degrees.
// This function is used for turning concave Polygons into convex polygons
// Mutates: point
function split(point: Point, allPoints: Point[]) {
    const { hub, connections } = point;
    const originalConnections = point.connections;
    let newConnections: Vec2[] = [];
    // Search for new connections
    for (let i = 0; i < connections.length; i++) {
        const currentVec2 = connections[i];
        const nextVec2Index = i + 1 >= connections.length ? 0 : i + 1;
        const nextVec2 = connections[nextVec2Index];
        const angle1 = getAngleBetweenVec2s(hub, currentVec2);
        const angle2 = getAngleBetweenVec2s(hub, nextVec2);
        // To find the angle between connections the order matters
        // The angle between 45 degrees and 135 degrees is 90 degrees; while
        // the angle between 135 degrees and 45 degrees (going all the way around the angle circle)
        // is 270 degrees.  This is why we adjust angle2
        const angleBetweenConnections = counterClockwiseAngle(angle1, angle2);
        // Only angles that are > Math.PI need to be split because that those are the angles
        // that would make the polygon concave
        if (angleBetweenConnections > Math.PI) {
            // Connections must be split
            // an intersection and take the biggest angle
            for (let otherPoint of allPoints) {
                if (vectorMath.equal(otherPoint.hub, hub)) {
                    // Do not run on self
                    continue;
                }
                if (connections.find(c => vectorMath.equal(c, otherPoint.hub)) || newConnections.find(c => vectorMath.equal(c, otherPoint.hub))) {
                    // Do not run on hub that already exists as a connection:
                    continue
                }
                const angle = getAngleBetweenVec2s(hub, otherPoint.hub);
                // Only consider otherPoints that are between the angles that we are splitting; because if it
                // wasn't than adding it as a connection wouldn't split the angle that we need to split
                if (isAngleBetweenAngles(angle, angle1, angle2)) {
                    // If choosing this angle would create a <= Math.PI angle between it and currentVec2, allow it:
                    if (counterClockwiseAngle(angle1, angle) <= Math.PI) {
                        // If lineSegment from hub to otherPoint.hub doesn't intersect other connections, allow it:
                        // TODO: future possible optimization, it currently tests all linesegments twice
                        if (allPoints.filter(p => {
                            // Do not include self point or otherPoint when
                            // checking for intersections to filter out points
                            // or else you will get false positive intersections
                            // which would make the new connection appear invalid
                            if (p.hub == hub || p.hub == otherPoint.hub) {
                                return false;
                            }
                            return p.connections.some(connection => {
                                // A line to check for intersections with
                                const l1 = { p1: p.hub, p2: connection };
                                // The new potential line
                                const l2 = { p1: hub, p2: otherPoint.hub }
                                const intersection = lineSegmentIntersection(l1, l2);
                                // Ignore intersections with the linesegment we are trying to find a connection to
                                if (intersection == undefined || vectorMath.equal(intersection, l1.p1) || vectorMath.equal(intersection, l1.p2)) {
                                    return false
                                } else {
                                    // Skip if the new connection intersects with a line segment other than
                                    // the linesegment in question (which is l1)
                                    return true;
                                }
                            });
                        }).length == 0) {
                            // It's a keeper, add it to connections
                            newConnections.push(otherPoint.hub);
                        }

                    }
                }
            }
        }

    }
    if (newConnections.length) {
        point.connections = [...point.connections, ...newConnections];
        // Resort connections now that there are new connections because the angles have split
        sortConnectionsByAngle(point);
    }
    // Merge connections that are superfluous (divisions that don't prevent it from becoming concave) so we don't have more polygons than we need
    // Note, all connections are NOT superfluous if it has less than 3
    if (point.connections.length > 3) {
        for (let i = 0; i < point.connections.length; i++) {
            const prevVec2Index = i - 1 < 0 ? point.connections.length - 1 : i - 1;
            const prevVec2 = point.connections[prevVec2Index];
            const currentVec2 = point.connections[i];
            if (originalConnections.some(p => vectorMath.equal(currentVec2, p))) {
                // Do not remove original connections.  The original connections are walls
                // and should not be "optimized" away since they MUST remain connections.
                continue;
            }
            const nextVec2Index = i + 1 >= point.connections.length ? 0 : i + 1;
            const nextVec2 = point.connections[nextVec2Index];
            const angle1 = getAngleBetweenVec2s(hub, prevVec2);
            const middlePointAngle = getAngleBetweenVec2s(hub, currentVec2)
            const angle2 = counterClockwiseAngle(angle1, middlePointAngle);
            const angle3 = counterClockwiseAngle(middlePointAngle, getAngleBetweenVec2s(hub, nextVec2));
            if (angle2 + angle3 <= Math.PI) {
                // Merge angles by removing currentVec2 from connections
                point.connections.splice(i, 1);
            }
        }
    }
}
// Find the angle between two angles going counter-clockwise around the angle circle
// So 135deg to -135deg is 45deg because -135deg == 225deg
function counterClockwiseAngle(rad1: number, rad2: number): number {
    const shouldInvert = rad1 > rad2;
    // Convert rad2 into an identical angle that is larger than rad1
    const adjustedRad2 = shouldInvert ? rad2 + Math.PI * 2 : rad2;
    const result = adjustedRad2 - rad1;
    // Normalize between 0 and Math.PI*2
    const normalizedResult = result > Math.PI * 2 ? result % (Math.PI * 2) : result;
    return normalizedResult;
}
export const testables = {
    split,
    lineSegmentsToPoints,
    getAngleBetweenVec2s,
    isAngleBetweenAngles,
    normalizeAngle,
    counterClockwiseAngle
}
// Takes an array of points and turns them into an array of convex polygons for pathfinding.
// insetSize is the distance that the points of the mesh should be away from the "points".
// insetSize is necessary for entities with a non-zero radius to path using a mesh without
// running into walls.  Without it, they may try to take a path that they could not fit
// through.
// export function generateConvexPolygonMesh(lineSegments: LineSegment[], insetSize: number): Polygon[] {
export function generateConvexPolygonMesh(lineSegments: LineSegment[], insetSize: number): Point[] {

    const points = lineSegmentsToPoints(lineSegments);
    // Adjust points according to inset:
    // --
    // Since at this stage points just have their original connections
    // (should be exactly 2 per hub), I should just be able to project
    // the hub on the normal vector away from each connection for the magnitude of
    // each connection
    for (let point of points) {
        const startVec2 = { x: point.hub.x, y: point.hub.y };
        const projectToPoint = { x: point.hub.x, y: point.hub.y }
        for (let connection of point.connections) {
            const dx = point.hub.x - connection.x;
            const dy = point.hub.y - connection.y;
            projectToPoint.x -= dx;
            projectToPoint.y -= dy;
        }
        const X = projectToPoint.x - point.hub.x;
        const Y = projectToPoint.y - point.hub.y;
        const D = distance(projectToPoint, point.hub);
        const d = insetSize;
        const relativeAdjustedPoint = similarTriangles(X, Y, D, d);
        const _adjustedPoint = vectorMath.subtract(point.hub, relativeAdjustedPoint);
        const adjustedPoint = { x: Math.round(_adjustedPoint.x), y: Math.round(_adjustedPoint.y) };

        // Update connections to the hub that's about to change:
        for (let otherPoint of points) {
            // Exclude self
            if (vectorMath.equal(otherPoint.hub, startVec2)) {
                continue;
            }
            for (let connection of otherPoint.connections) {
                if (vectorMath.equal(connection, startVec2)) {
                    connection.x = adjustedPoint.x;
                    connection.y = adjustedPoint.y;
                }
            }
        }
        // Update hub
        point.hub = adjustedPoint;
    }

    // test print
    // points.map(p => { console.log(p.hub, JSON.stringify(p.connections)) });

    // split points
    points.forEach(p => split(p, points));

    // Optimize further
    // Given, each line between a hub and a connection,
    // there are at most 2 polygons attached, if without the line
    // both polygons make up a convex polygon the line can be removed:
    // Note: Can this replace split()'s optimization (which may be broken under
    // certain circumstances.
    // TODO: Develop this


    return points;
}

export function findPath(from: Vec2, to: Vec2, mesh: Polygon[]): Vec2[] {
    return [];
}