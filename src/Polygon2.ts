import * as LineSegment from "./collision/lineSegment";
import { Vec2 } from "./Vec";
import * as Vec from "./Vec";
import { growOverlappingCollinearLinesInDirectionOfP2 } from "./Polygon";
import { distance } from "./math";
import { clockwiseAngle } from "./Angle";

// A Polygon2 is just an array of points where the last point connects to the first point to form a closed shape
export type Polygon2 = Vec2[];


// Given an array of Polygon2s, it returns an array of Polygon2s where overlapping
// polygons have been merged into one.
// Allows for "donuts": where 2 polygon2s can merge into 2 different polygon2s
// (see tests for "donuts" demonstration).
export function mergePolygon2s(polygons: Polygon2[]): Polygon2[] {
    // Convert all polygons into line segments for processing:
    const lineSegments = polygons.map(toLineSegments).flat();

    // resultPolys stores the merged polygons:
    const resultPolys: Polygon2[] = [];

    for (let i = 0; i < lineSegments.length; i++) {
        const lineSegment = lineSegments[i];
        if (lineSegment) {
            const poly = processLineSegment(lineSegment, lineSegments);
            if (poly && poly.length) {
                resultPolys.push(poly);
            }
        }
    }
    return resultPolys;
}

// Processes a lineSegment by walking along it and branching along other 
// intersecting lineSegments until it finds it's way back to the beginning
export function processLineSegment(processingLineSegment: LineSegment.LineSegment, lineSegments: LineSegment.LineSegment[]): Polygon2 {
    // Add point to the newPoly
    const newPoly: Polygon2 = [processingLineSegment.p1];
    let currentLine = processingLineSegment;
    // Loop Branch:
    do {
        // Get the closest branch
        const branch = getClosestBranch(currentLine, lineSegments);
        console.log('chosen branch', branch);
        if (branch === undefined) {
            // Return an empty polygon since it did not reconnect to itself
            console.log('FAIL, empty did not reconnect\n')
            return [];
        }
        currentLine = branch.nextLine;
        // console.log('next line', currentLine);
        // Check to see if point is already in the poly
        // Closes when the point about to be added is in the newPoly
        const indexOfMatch = newPoly.findIndex(p => Vec.equal(currentLine.p1, p));
        if (indexOfMatch !== -1) {
            // LEFT OFF: TODO remove line segments that are moved to a new poly
            console.log('DONE', indexOfMatch, newPoly, '\n')
            // The poly is successfully closed and done processing
            // Use slice to omit points before the match so that the polygon
            // is closed perfectly
            return newPoly.slice(indexOfMatch);
        }
        // Add that point to newPoly
        newPoly.push(currentLine.p1);
        console.log('points', newPoly);


    } while (true);
}
export function toLineSegments(poly: Polygon2): LineSegment.LineSegment[] {
    let lastPoint = null;
    if (poly[0] == undefined) {
        return [];
    }
    let lineSegments: LineSegment.LineSegment[] = [];
    for (let point of poly) {
        if (lastPoint) {
            lineSegments.push({ p1: lastPoint, p2: point });
        }
        lastPoint = point;
    }
    // Add last point to first point:
    if (lastPoint) {
        lineSegments.push({ p1: lastPoint, p2: poly[0] });
    } else {
        console.error('Error should never happen, lastPoint is falsey');
    }
    return lineSegments;
}
function getClosestBranch(line: LineSegment.LineSegment, lineSegments: LineSegment.LineSegment[]): Branch | undefined {
    console.log('---------', line)
    line = growOverlappingCollinearLinesInDirectionOfP2(line, lineSegments);

    let branches: Branch[] = [];
    // Check for collisions between the last line in path and line segments
    for (let wall of lineSegments) {
        if (LineSegment.equal(line, wall)) {
            // Don't test for intersections with self
            continue;
        }
        let intersection = LineSegment.lineSegmentIntersection(line, wall);
        if (intersection) {
            // Round the intersection since points that are of by 0.00000000001 (roughly) should be considered idential
            // (the lineSegment intersection function isn't perfect)
            intersection = Vec.round(intersection);
            const dist = distance(line.p1, intersection);
            // don't consider lines that intersect with p1 or else it'll return
            // a previous line in the path
            if (dist == 0) {
                continue;
            }
            // relative angle:
            const lastLineAngle = Vec.getAngleBetweenVec2s(intersection, line.p1);
            // If the intersection is the first vertex then the next point is the second vertex
            // but if the intersection is just an intersection along the line, then the next point is the first vertex
            const nextLineAngle = Vec.getAngleBetweenVec2s(intersection, wall.p2);
            const branchAngle = clockwiseAngle(lastLineAngle, nextLineAngle);
            // console.log(' lastLineAngle', lastLineAngle * 180 / Math.PI, 'nextLineAngle', nextLineAngle * 180 / Math.PI, 'branchANgle', branchAngle * 180 / Math.PI);

            // Exclude branches where the intersection is equal to the end point
            if (!Vec.equal(intersection, wall.p2)) {
                branches.push({
                    branchAngle,
                    distance: dist,
                    nextLine: { p1: intersection, p2: wall.p2 },
                });
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
    console.log('branches', branches.map(b => ({
        ...b, nextLine: LineSegment.toString(b.nextLine), branchAngle: b.branchAngle * 180 / Math.PI
    })))
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
export interface Branch {
    // in rads
    branchAngle: number;
    distance: number;
    nextLine: LineSegment.LineSegment;
}