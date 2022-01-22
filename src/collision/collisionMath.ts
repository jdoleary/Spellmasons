import type { Vec2 } from "../commonTypes";
export interface LineSegment {
    p1: Vec2;
    p2: Vec2;
}

function slope(line: LineSegment): number | undefined {
    const X = (line.p2.x - line.p1.x);
    if (X == 0) {
        return undefined
    }
    return (line.p2.y - line.p1.y) / X;
}
// Standard Form: ax+by+c=0
interface LineInStandardForm {
    a: number,
    x: number,
    b: number,
    y: number,
    c: number
}
// Converts a LineSegment to a LineInStandardForm
function toStandardForm(line: LineSegment): LineInStandardForm | undefined {
    const M = slope(line);
    if (M !== undefined) {
        const c = -(line.p1.y - M * line.p1.x)
        return {
            a: -M,
            x: line.p1.x,
            b: 1,
            y: line.p1.y,
            c
        }
    } else {
        return undefined
    }
}
function intersectionOfLines(line: LineInStandardForm, line2: LineInStandardForm): Vec2 {
    // https://www.cuemath.com/geometry/intersection-of-two-lines/
    return {
        x: (line.b * line2.c - line2.b * line.c) / (line.a * line2.b - line2.a * line.b),
        y: (line.c * line2.a - line2.c * line.a) / (line.a * line2.b - line2.a * line.b),
    }

}
// Given a line and a point, find the intersection point of the line an a vector starting at "point",
// moving twords line at a right angle to line
// This is useful for determining if a circle intersects with a line
function findWherePointIntersectLineAtRightAngle(point: Vec2, line: LineInStandardForm): Vec2 {
    const inverseLine1Slope = line.a;
    const line2 = { p1: point, p2: { x: point.x + inverseLine1Slope, y: point.y + 1 } }
    const line2InStandardForm = toStandardForm(line2);
    if (line2InStandardForm) {
        return intersectionOfLines(line, line2InStandardForm);
    } else {
        // line2 is vertical (has an undefined slope)
        return {
            x: line2.p1.x,
            y: line.y
        }
    }
}
// See comments for the similar function "findWherePointIntersectLineAtRightAngle"; this function differs
// in that it considers a point and a lineSEGMENT.
// Note, this function is useful for determining intersection between a circle and a linesegment; HOWEVER, if the 
// circle is only intersecting with an endpoint of the line, this function will likely return undefined because
// the right angle point of intersection will be outside of the line segment (unless the circle is positioned at a 
// perfect right angle to the endpoint).  So this function should be used together with other functions to account
// for the endpoints of the line segment
export function findWherePointIntersectLineSegmentAtRightAngle(point: Vec2, line: LineSegment): Vec2 | undefined {
    const lineInStandardForm = toStandardForm(line);
    const largestX = Math.max(line.p1.x, line.p2.x);
    const smallestX = Math.min(line.p1.x, line.p2.x);
    const largestY = Math.max(line.p1.y, line.p2.y);
    const smallestY = Math.min(line.p1.y, line.p2.y);
    if (lineInStandardForm) {
        const intersection = findWherePointIntersectLineAtRightAngle(point, lineInStandardForm);
        // Return the intersection point IF it is between the endpoints of the line segment
        if (intersection.y <= largestY && intersection.y >= smallestY && intersection.x <= largestX && intersection.x >= smallestX) {
            return intersection
        } else {
            // Point is not on line segment
            return undefined
        }
    } else {
        // line is vertical, so the intersection is any x on "line" and point.y
        const intersection = {
            x: line.p1.x,
            y: point.y
        }
        // Return the intersection point IF it is between the endpoints of the line segment
        if (intersection.y <= largestY && intersection.y >= smallestY && intersection.x <= largestX && intersection.x >= smallestX) {
            return intersection
        } else {
            // Point is not on line segment
            return undefined
        }
    }

}
export const testables = {
    slope,
    toStandardForm,
    findWherePointIntersectLineAtRightAngle
}
