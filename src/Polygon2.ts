import { LineSegment } from "./collision/collisionMath";
import { Vec2 } from "./Vec";

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
            if (poly) {
                resultPolys.push(poly);
            }
        }
    }
    return resultPolys;
}

// Processes a lineSegment by walking along it and branching along other 
// intersecting lineSegments until it finds it's way back to the beginning
export function processLineSegment(processingLineSegment: LineSegment, lineSegments: LineSegment[]): Polygon2 {
    // Add point to the newPoly
    // Loop Branch:
    // Get the closest branch
    // Add that point to newPoly
    // Check to see if point is already in the poly
    // if so, exit loop
    // else, continue loop

    return [];
}
export function toLineSegments(poly: Polygon2): LineSegment[] {
    let lastPoint = null;
    if (poly[0] == undefined) {
        return [];
    }
    let lineSegments: LineSegment[] = [];
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