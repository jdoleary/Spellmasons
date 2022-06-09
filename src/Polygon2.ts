import * as LineSegment from "./collision/lineSegment";
import { Vec2 } from "./Vec";
import * as Vec from "./Vec";
import { distance } from "./math";
import { clockwiseAngle, isAngleBetweenAngles } from "./Angle";
import { getLoopableIndex, getPointNormalVector } from "./Polygon";

// A line segment that contains a reference to the polygon that it belongs to
export type Polygon2LineSegment = LineSegment.LineSegment &
// The polygon that these points belong to
{ polygon: Polygon2 };

// A Polygon2 is just an array of points where the last point connects to the first point to form a closed shape
export type Polygon2 = Vec2[];
export function mergeCollinearOverlappingSameDirectionLines(lines: LineSegment.LineSegment[]): LineSegment.LineSegment[] {
    const newLines = [];
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (line) {
            const linesForMerging = lines.filter(l => {
                const relation = LineSegment.getRelation(line, l);
                return relation.isCollinear && relation.isOverlapping && relation.pointInSameDirection;
            });
            let newLine = linesForMerging[0];
            if (newLine) {
                for (let mergeLine of linesForMerging) {
                    if (mergeLine == newLine) {
                        //skip self
                        continue;
                    }
                    if (distance(mergeLine.p1, newLine.p2) > distance(newLine.p1, newLine.p2)) {
                        newLine.p1 = mergeLine.p1;
                    }
                    if (distance(newLine.p1, mergeLine.p2) > distance(newLine.p1, newLine.p2)) {
                        newLine.p2 = mergeLine.p2;
                    }
                }
                // unshift so that lines maintain their original order if not modified since
                // the forloop iterates it backwards
                newLines.unshift(newLine);
            }
            // Remove lines once they have been used
            for (let removeWall of linesForMerging) {
                lines.splice(lines.indexOf(removeWall), 1);
            }
            i = lines.length;
        }
    }
    return newLines;

}
export function splitIntersectingLineSegments(line: LineSegment.LineSegment, lineSegments: LineSegment.LineSegment[]): LineSegment.LineSegment[] {
    let splitLineSegments: LineSegment.LineSegment[] = []
    let intersections: Vec2[] = [];
    for (let other of lineSegments) {
        if (line == other) {
            // Don't test against self
            continue;
        }
        const { isCollinear } = LineSegment.getRelation(line, other);
        // Ignore collinear lines since even if they are overlapping
        // they would have infinite intersections and can't be meaningfully
        // split
        if (isCollinear) {
            continue;
        }
        const intersection = LineSegment.lineSegmentIntersection(line, other);
        if (intersection) {
            // Ignore intersections at vertex, these should not be "split" because
            // if it were it would split into a "no length" line (a point).
            if (!Vec.equal(intersection, line.p1) && !Vec.equal(intersection, line.p2)) {
                // Don't add duplicate intersection points
                if (intersections.findIndex(i => Vec.equal(i, intersection)) == -1) {
                    intersections.push(intersection)
                }
            }
        }
    }
    // Sort closest first
    intersections.sort((a, b) => distance(line.p1, a) - distance(line.p1, b));
    // Make new line segments
    let lastPoint = line.p1;
    for (let intersection of intersections) {
        splitLineSegments.push({ p1: lastPoint, p2: intersection });
        lastPoint = intersection;
    }
    splitLineSegments.push({ p1: lastPoint, p2: line.p2 });

    return splitLineSegments;
}
export function splitIntersectingPolygon2LineSegments(lineSegments: Polygon2LineSegment[]): Polygon2LineSegment[] {
    let splitPolygon2LineSegments: Polygon2LineSegment[] = []
    for (let line of lineSegments) {
        const splitLineSegments = splitIntersectingLineSegments(line, lineSegments);
        splitPolygon2LineSegments.push(...splitLineSegments.map(ls => ({ ...ls, polygon: line.polygon })));
    }
    return splitPolygon2LineSegments;
}

// Given an array of Polygon2s, it returns an array of Polygon2s where overlapping
// polygons have been merged into one.
// Allows for "donuts": where 2 polygon2s can merge into 2 different polygon2s
// (see tests for "donuts" demonstration).
export function mergePolygon2s(polygons: Polygon2[]): Polygon2[] {
    // Convert all polygons into line segments for processing:
    let polyLineSegments = polygons.map(toPolygon2LineSegments).flat();

    // Split all line segments along intersections
    // so that there are no line segments left with intersections
    // other than at their verticies
    polyLineSegments = splitIntersectingPolygon2LineSegments(polyLineSegments);

    // resultPolys stores the merged polygons:
    const resultPolys: Polygon2[] = [];
    // Remove any linesegment that has it's centerpoint
    // inside of the same other polygon
    for (let i = polyLineSegments.length - 1; i >= 0; i--) {
        const lineSegment = polyLineSegments[i];
        if (lineSegment) {
            const center = LineSegment.getCenterPoint(lineSegment);
            for (let poly of polygons) {
                // Ignore polygon that owns the linesegment:
                if (lineSegment.polygon == poly) {
                    continue;
                }
                const isInside = isVec2InsidePolygon(center, poly);
                if (isInside) {
                    const notDirectlyOnLine = toLineSegments(poly).every(ls => !LineSegment.isPointOnLineSegment(center, ls));
                    // Only remove a lineSegment if it is both inside a polygon and the center point
                    // is not directly on one of the linesegments of that polygon.
                    // This is very important and shows it's usefulness in the 
                    // "given boxes that are mostly identical > should keep the larger one" test where
                    // overlapping boxes with slight differences must not be removed

                    if (notDirectlyOnLine) {
                        polyLineSegments.splice(i, 1);
                        break;
                    }
                }

            }
        }
    }
    // Remove unnecessary in-between verticies:
    const lineSegments = mergeCollinearOverlappingSameDirectionLines(polyLineSegments)
    // Turn all remaining line segments into polygons:
    for (let lineSegment of lineSegments) {
        const poly = processLineSegment(lineSegment, lineSegments);
        // Valid polygons must be 3 points or more, or else it will just be a line
        if (poly && poly.length > 2) {
            resultPolys.push(poly);
        }
    }

    return resultPolys;
}
export function growOverlappingCollinearLinesInDirectionOfP2(line: LineSegment.LineSegment, walls: LineSegment.LineSegment[]): { grownLine: LineSegment.LineSegment, removedLines: LineSegment.LineSegment[] } {
    // Grow test line from line.p1 to the farthest colinear, touching line's p2
    const removedLines = [];
    let testLineGrew = false;
    let relevantWalls = walls.filter(w => LineSegment.isCollinearAndPointInSameDirection(line, w));
    const originalNumberOfPotentialGrowthLoops = relevantWalls.length;
    for (let i = 0; i < originalNumberOfPotentialGrowthLoops; i++) {
        testLineGrew = false;
        for (let wall of relevantWalls) {
            if (LineSegment.isCollinearAndOverlapping(line, wall) && distance(line.p1, line.p2) < distance(line.p1, wall.p2)) {
                testLineGrew = true;
                // Remove the wall that was used for growing
                relevantWalls = relevantWalls.filter(x => x !== wall);
                removedLines.push(wall);

                line.p2 = wall.p2;
                break;
            }
        }
        if (!testLineGrew) {
            break;

        }

    }
    return { grownLine: line, removedLines };

}

// Processes a lineSegment by walking along it and branching along other 
// intersecting lineSegments until it finds it's way back to the beginning
// Returns a polygon and mutates the lineSegments array to remove the segments that
// were used or left dangling
export function processLineSegment(processingLineSegment: LineSegment.LineSegment, lineSegments: LineSegment.LineSegment[]): Polygon2 {
    // Add point to the newPoly
    const newPoly: Polygon2 = [processingLineSegment.p1];
    let currentLine = processingLineSegment;

    // These will be removed if they do not become part of the poly because they touch the poly.
    let danglingLineSegments = [];
    // Line segments used in the newPoly. LineSegments are moved out of the lineSegments array and into
    // this array during processing so that polygons can reconnect to already processed lineSegments, AND
    // so that these lineSegments will be premanently removed from the lineSegments array once this function
    // returns.
    let usedLineSegments = [];
    // lastMatch is a point in the poly that also exists previously in the poly's points.
    // This is important for polygons that share a single vertex but nothing else.  Since they are
    // touching, they need to be merged, but we don't want the algorithm to exit early just
    // because it found a match (a closed poly), so it stores the last match and carries on looking.
    // If it reaches a dead end and there is a match, it takes the closed poly that it already found - otherwise
    // there is no poly.  If it finds 2 points in a row that are already in the poly, it has now begun to loop
    // and knows that the poly it found is fully complete and can return with that poly.
    let lastMatch: Vec2 | undefined = undefined;
    let lastIntersection: Vec2 | undefined = undefined;

    // Loop Branch:
    do {
        // Get the closest branch
        const branch = getClosestBranch(currentLine, [...lineSegments, ...danglingLineSegments, ...usedLineSegments]);
        if (branch === undefined) {
            if (lastMatch) {
                // This is the first way to close a poly.  Branching has reached a dead end
                // and there is a lastMatch so close the poly at the last match.
                const matches = newPoly.map(p => lastMatch && Vec.equal(p, lastMatch))
                return newPoly.slice(matches.indexOf(true), matches.lastIndexOf(true));
            } else {
                // Return an empty polygon since it did not reconnect to itself
                return [];
            }
        } else {
            const indexOfBranchIntersectionInPoly = newPoly.findIndex(p => Vec.equal(branch.intersection, p));
            if (indexOfBranchIntersectionInPoly !== -1) {
                if (lastMatch && lastIntersection && Vec.equal(lastMatch, lastIntersection)) {
                    // This is the second way (and most common) way to close a poly.
                    // The lastIntersection is also a match for a previous point in the poly
                    // AND the current intersection is a match.  Two matches in a row
                    // means iterating along branches will now fully repeat which means
                    // we've found a perfect closed polygon.
                    // So close the polygon by removing the beginning dangling points (if any)
                    // and removing the last point (the last intersection) because it'll be
                    // the same as the first point after the beginning dangling points are removed
                    return newPoly.slice(indexOfBranchIntersectionInPoly - 1, -1);
                }
            }


        }
        // Now that we have a branch, split both the current line and the next line
        if (Vec.equal(branch.intersection, branch.branchingLine.p2)) {
            console.error('Unexpected: intersection should not be equal to branchingLine.p2')
        }
        if (Vec.equal(branch.intersection, currentLine.p1)) {
            console.error('Unexpected: intersection should not be equal to currentLine.p1')
        }
        // Remove currentLine and branchingLine from line segments because they are either
        // wholy used in the newPoly or they have been split and half of the split is dangling
        // and the other half is used in the newPoly.
        const branchingLineIndex = lineSegments.findIndex(ls => ls == branch.branchingLine);
        if (branchingLineIndex !== -1) {
            usedLineSegments.push(...lineSegments.splice(branchingLineIndex, 1));
        }
        const currentLineIndex = lineSegments.findIndex(ls => ls == currentLine);
        if (currentLineIndex !== -1) {
            usedLineSegments.push(...lineSegments.splice(currentLineIndex, 1));
        }

        // If intersection is not the end point of the current line, split the current line
        if (!Vec.equal(branch.intersection, currentLine.p2)) {
            danglingLineSegments.push({ p1: branch.intersection, p2: currentLine.p2 });
        }
        // Make the next current line be from intersection to branchingLine.p2
        currentLine = { p1: branch.intersection, p2: branch.branchingLine.p2 };

        // If intersection is not equal to p1 of branchingLine, split branching line so that the
        // later half (intersection to p2) is the currentLine and the former half becomes dangling.
        if (!Vec.equal(branch.intersection, branch.branchingLine.p1)) {
            danglingLineSegments.push({ p1: branch.branchingLine.p1, p2: branch.intersection });
        }
        // // Check to see if intersection is already in the poly
        // // Closes when the point about to be added is in the newPoly
        const indexOfP1Match = newPoly.findIndex(p => Vec.equal(branch.intersection, p));
        if (indexOfP1Match !== -1) {
            lastMatch = branch.intersection;
        }
        lastIntersection = branch.intersection;

        // Add that point to newPoly
        newPoly.push(currentLine.p1);


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
export function toPolygon2LineSegments(polygon: Polygon2): Polygon2LineSegment[] {
    return toLineSegments(polygon).map(ls => ({ ...ls, polygon }));
}
function getClosestBranch(line: LineSegment.LineSegment, lineSegments: LineSegment.LineSegment[]): Branch | undefined {

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

            // Exclude branches where the intersection is equal to the end point
            if (!Vec.equal(intersection, wall.p2)) {
                branches.push({
                    branchAngle,
                    distance: dist,
                    intersection,
                    branchingLine: wall
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
    // console.log('branches', LineSegment.toString(line), branches.map(b => ({
    //     ...b, branchingLine: LineSegment.toString(b.branchingLine), branchAngle: b.branchAngle * 180 / Math.PI
    // })))

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
// Refactored from Polygon to Polygon2
// Note: There is a slight flaw in this algorithm in that if the point lies
// directly on a line of the poly on the left side, it will yield a false negative
export function isVec2InsidePolygon(point: Vec2, polygon: Polygon2): boolean {
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

    const horizontalLine: LineSegment.LineSegment = { p1: point, p2: { x: Number.MAX_SAFE_INTEGER, y: point.y } };
    // Start outside, so each odd number of flips will determine it to be inside
    let isInside = false;
    const intersections: Vec2[] = [];
    for (let wall of toLineSegments(polygon)) {
        const _intersection = LineSegment.lineSegmentIntersection(horizontalLine, wall)
        // Rounding and removing extra zeros: https://stackoverflow.com/a/12830454/4418836
        // See test
        // 'should return false for this real world example which would incur a floating point error without the current form of the function'
        // for explanation
        const intersection = _intersection ? { x: +_intersection.x.toFixed(2), y: +_intersection.y.toFixed(2) } : undefined

        //  Don't process the same intersection more than once
        //  Only process intersections at verticies once
        if (intersection && !intersections.find(i =>
            // intersection already processed
            Vec.equal(i, intersection) &&
            // intersection equals a vertex of the poly
            polygon.some(p => Vec.equal(intersection, p))
        )) {
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
                const indexOfVertex = polygon.findIndex(p => Vec.equal(p, intersection));
                const nextPoint = polygon[getLoopableIndex(indexOfVertex + 1, polygon)];
                const prevPoint = polygon[getLoopableIndex(indexOfVertex - 1, polygon)];
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
                    // Debug logging
                    // console.log(' start/end', Math.round(startClockwiseAngle * 180 / Math.PI), Math.round(endClockwiseAngle * 180 / Math.PI));
                    // console.log(' v1angle/v2angle', Math.round(v1Angle * 180 / Math.PI), Math.round(v2Angle * 180 / Math.PI));
                    // console.log(' not inside angle:', Math.round(clockwiseAngle(startClockwiseAngle, v1Angle) * 180 / Math.PI), Math.round(clockwiseAngle(startClockwiseAngle, v2Angle) * 180 / Math.PI), Math.round(allowableAngle * 180 / Math.PI), v1AngleInside, v2AngleInside)
                } else {
                    console.error('Next point or prev point is undefined. This error should never occur.');
                }
            } else {
                // If it intersects with a wall, flip the bool
                isInside = !isInside
            }
        }
    }
    return isInside;

}
// Refactored from Polygon.ts
function projectPointForPathingMesh(polygon: Polygon2, pointIndex: number, magnitude: number): Vec2 {
    const point = polygon[pointIndex];
    if (point) {
        const nextPoint = polygon[getLoopableIndex(pointIndex + 1, polygon)];
        const prevPoint = polygon[getLoopableIndex(pointIndex - 1, polygon)];
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
// Refactored from Polygon.ts
// Expand polygon: Grows a polygon into it's "outside" by the distance of magnitude
// along the normal vectors of each vertex.
// Pure: returns a new polygon without mutating the old
export function expandPolygon(polygon: Polygon2, magnitude: number): Polygon2 {
    return polygon.map((_p, i) => projectPointForPathingMesh(polygon, i, magnitude));
}

// Refactored from Polygon.ts
export function* makePolygonIndexIterator(polygon: Polygon2, startIndex: number = 0): Generator<number, undefined> {

    for (let i = startIndex; i < startIndex + polygon.length; i++) {
        yield getLoopableIndex(i, polygon);

    }

    return
}
// Refactored from Polygon.ts
export function getPointsFromPolygonStartingAt(polygon: Polygon2, startPoint: Vec2): Vec2[] {
    const startPointIndex = polygon.findIndex(p => Vec.equal(p, startPoint))
    if (startPointIndex == -1) {
        // startPoint is not on polygon;
        // Note sometimes this function is used to determine if two polygons are equivalent
        // so it is within the relm of regular usage to pass a startPoint that pay not
        // exist on polygon.points
        return []
    } else {
        const polygonIndicies = Array.from(makePolygonIndexIterator(polygon, startPointIndex))
        const vec2s = polygonIndicies.map(i => {
            if (polygon[i]) {
                return polygon[i];
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
// Refactored from Polygon.ts
export function doesVertexBelongToPolygon(p: Vec2, poly: Polygon2): boolean {
    return !!poly.find(x => Vec.equal(x, p));
}
// Refactored from Polygon.ts
export function getInsideAnglesOfWall(p: Polygon2LineSegment): { start: number, end: number } {
    const A = Vec.getAngleBetweenVec2s(p.p1, p.p2);
    return { start: A, end: A - Math.PI };
}
// Refactored from Polygon.ts
// In radians
// Returns the inside angle of a point from start clockwise to end
// The "inside angle" is the angle that points towards the inside ("non-walkable")
// part of the polygon
export function getInsideAnglesOfPoint(polygon: Polygon2, pointIndex: number): { start: number, end: number } {
    const point = polygon[pointIndex];
    if (point) {
        const nextPoint = polygon[getLoopableIndex(pointIndex + 1, polygon)];
        const prevPoint = polygon[getLoopableIndex(pointIndex - 1, polygon)];
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
// Refactored from Polygon.ts
// Returns true if casting a line from point (a vertex on a polygon) to a target Vec2 passes through the
// inside of point's polygon
export function doesLineFromPointToTargetProjectAwayFromOwnPolygon(polygon: Polygon2, pointIndex: number, target: Vec2): boolean {
    const point = polygon[pointIndex];
    if (point !== undefined) {
        const { start, end } = getInsideAnglesOfPoint(polygon, pointIndex);
        const angleToTarget = Vec.getAngleBetweenVec2s(point, target);
        return !isAngleBetweenAngles(angleToTarget, start, end);
    } else {
        console.error("Invalid pointIndex");
        return false;
    }
}
export interface Branch {
    // in rads
    branchAngle: number;
    distance: number;
    intersection: Vec.Vec2;
    branchingLine: LineSegment.LineSegment;
}