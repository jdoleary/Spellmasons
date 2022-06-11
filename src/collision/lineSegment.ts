import { distance } from "../math";
import * as Vec from "../Vec";
export interface LineSegment {
    p1: Vec.Vec2;
    p2: Vec.Vec2;
}

export function equal(line1: LineSegment, line2: LineSegment): boolean {
    return Vec.equal(line1.p1, line2.p1) && Vec.equal(line1.p2, line2.p2);
}
export function toString(line: LineSegment): string {
    return `${line.p1.x},${line.p1.y} to ${line.p2.x},${line.p2.y}`;
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
export function toStandardForm(line: LineSegment): LineInStandardForm | undefined {
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
// TODO Doesn't account for edge cases such as vertical lines
// OLD, do not use
function intersectionOfLines(line: LineInStandardForm, line2: LineInStandardForm): Vec.Vec2 {
    // https://www.cuemath.com/geometry/intersection-of-two-lines/
    return {
        x: (line.b * line2.c - line2.b * line.c) / (line.a * line2.b - line2.a * line.b),
        y: (line.c * line2.a - line2.c * line.a) / (line.a * line2.b - line2.a * line.b),
    }
}
// Given a line and a point, find the intersection point of the line an a vector starting at "point",
// moving twords line at a right angle to line
// This is useful for determining if a circle intersects with a line
function findWherePointIntersectLineAtRightAngle(point: Vec.Vec2, line: LineInStandardForm): Vec.Vec2 {
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
export function findWherePointIntersectLineSegmentAtRightAngle(point: Vec.Vec2, line: LineSegment): Vec.Vec2 | undefined {
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
export function getCenterPoint(ls: LineSegment): Vec.Vec2 {
    return Vec.add(ls.p1, Vec.multiply(0.5, Vec.subtract(ls.p2, ls.p1)));

}
export function isPointOnLineSegment(point: Vec.Vec2, lineSegment: LineSegment): boolean {
    const segmentSlope = slope(lineSegment);
    const slopeFromPointToEndOfSegment = slope({ p1: point, p2: lineSegment.p2 })
    if (segmentSlope == slopeFromPointToEndOfSegment) {
        const pointIsInBoundingBoxOfSegment = point.x >= Math.min(lineSegment.p1.x, lineSegment.p2.x)
            && point.x <= Math.max(lineSegment.p1.x, lineSegment.p2.x)
            && point.y >= Math.min(lineSegment.p1.y, lineSegment.p2.y)
            && point.y <= Math.max(lineSegment.p1.y, lineSegment.p2.y);
        return pointIsInBoundingBoxOfSegment;
    }
    return false;

}
// modified from https://stackoverflow.com/a/3461533/4418836
export function isOnOutside(line: LineSegment, c: Vec.Vec2): boolean {
    return ((line.p2.x - line.p1.x) * (c.y - line.p1.y) - (line.p2.y - line.p1.y) * (c.x - line.p1.x)) > 0;
}
export function getParametricRelation(l1: LineSegment, l2: LineSegment) {
    // l1 expressed as p to p+r
    const p = l1.p1;
    const r = Vec.subtract(l1.p2, l1.p1);
    // l2 expressed as q to q+s
    const q = l2.p1;
    const s = Vec.subtract(l2.p2, l2.p1);
    const qMinusP = Vec.subtract(q, p);
    const rCrossS = Vec.crossproduct(r, s);
    // If r × s = 0 and (q − p) × r = 0, then the two lines are collinear.
    const isCollinear = rCrossS == 0 && Vec.crossproduct(qMinusP, r) == 0;
    const pointInSameDirection = Vec.dotProduct(s, r) >= 0;
    //     In this case, express the endpoints of the second segment (q and q + s) in terms of the equation of the first line segment (p + t r):
    //     t0 = (q − p) · r / (r · r)
    //     t1 = (q + s − p) · r / (r · r) = t0 + s · r / (r · r)
    if (isCollinear) {
        const dotRR = Vec.dotProduct(r, r);
        const dotSR = Vec.dotProduct(s, r);
        const t0 = Vec.dotProduct(Vec.subtract(q, p), r) / dotRR;
        const t1 = t0 + dotSR / dotRR;
        // If the interval between t0 and t1 intersects the interval [0, 1] then the line segments are collinear and overlapping; otherwise they are collinear and disjoint.
        // Note that if s and r point in opposite directions, then s · r < 0 and so the interval to be checked is [t1, t0] rather than [t0, t1].
        const l2p1Insidel1 = (0 <= t0 && t0 <= 1);
        const l2p2Insidel1 = (0 <= t1 && t1 <= 1);
        const l2FullyCoversl1 = (t0 <= 0 && t1 >= 1);
        const l1FullyCoversl2 = (t1 <= 0 && t0 >= 1);
        const isOverlapping = l2p1Insidel1 || l2p2Insidel1 || l2FullyCoversl1 || l1FullyCoversl2;
        return {
            p, r, q, s, qMinusP, rCrossS, isCollinear, pointInSameDirection, isOverlapping, l2p1Insidel1, l2p2Insidel1, l2FullyCoversl1
        }
    } else {
        return {
            p, r, q, s, qMinusP, rCrossS, isCollinear, pointInSameDirection, isOverlapping: false
        }
    }
}
export function getRelation(l1: LineSegment, l2: LineSegment): { isCollinear: boolean, isOverlapping: boolean, pointInSameDirection: boolean } {
    const { isCollinear, pointInSameDirection, isOverlapping } = getParametricRelation(l1, l2);
    return { isCollinear, pointInSameDirection, isOverlapping };
}
// A slice of logic from lineSegmentIntersection
// returns true if two line segmenst are collinear and point in the same direction
export function isCollinearAndPointInSameDirection(l1: LineSegment, l2: LineSegment): boolean {
    const { isCollinear, pointInSameDirection } = getRelation(l1, l2);
    return isCollinear && pointInSameDirection;

}
// A slice of logic from lineSegmentIntersection
// returns true if two line segmenst are both collinear and overlapping
export function isCollinearAndOverlapping(l1: LineSegment, l2: LineSegment): boolean {
    const { isCollinear, isOverlapping } = getRelation(l1, l2);
    return isCollinear && isOverlapping;
}

// Test l1 for intersections with each of otherLines; of all the intersections return the closest intersection
export function closestLineSegmentIntersection(l1: LineSegment, otherLines: LineSegment[]): Vec.Vec2 | undefined {
    let shortestDistance = Number.MAX_SAFE_INTEGER;
    let closestIntersection = undefined;
    for (let line of otherLines) {
        // Don't test against self
        if (line == l1) {
            continue;
        }
        const intersection = lineSegmentIntersection(l1, line);
        if (intersection) {
            const distanceToIntersection = distance(l1.p1, intersection);
            if (!closestIntersection || distanceToIntersection < shortestDistance) {
                shortestDistance = distanceToIntersection;
                closestIntersection = intersection;
            }
        }
    }
    return closestIntersection;
}

// Adapted from https://stackoverflow.com/a/565282
// Resources https://www.math.usm.edu/lambers/mat169/fall09/lecture25.pdf
// Example points: "Converting your example into my notation, I get p=(11,11), r=(-12,-12), q=(0,0), s=(0,10), r×s=-120, t=11/12, u=0. Since r×s is non-zero, the segments are not parallel."
export function lineSegmentIntersection(l1: LineSegment, l2: LineSegment): Vec.Vec2 | undefined {
    const { p, r, s, qMinusP, rCrossS, isCollinear, isOverlapping, l2p1Insidel1, l2p2Insidel1, l2FullyCoversl1 } = getParametricRelation(l1, l2);
    if (isCollinear) {
        if (isOverlapping) {
            // Since the line segments are collinear and overlapping, there are infinite intersection points,
            // but since this function only returns 1 intersection point, I, personally, am opting to prefer
            // an endpoing on l1 over l2 and the p2 point over the p1 point
            if (l2p1Insidel1 && l2p2Insidel1) {
                // l1 fully covers l2
                return l2.p2;
            } else if (l2p1Insidel1) {
                // Infinite intersections, pick arbitrary one
                return l2.p1;
            } else if (l2p2Insidel1) {
                // Infinite intersections, pick arbitrary one
                return l2.p2;
            } else if (l2FullyCoversl1) {
                return l1.p2;
            } else {
                // This should never happen, if the line segments are overlapping, one of the above cases
                // will be true
                return l2.p2;
            }
        } else {
            // No intersection
            return undefined
        }
    }
    // If r × s = 0 and (q − p) × r ≠ 0, then the two lines are parallel and non-intersecting.
    if (rCrossS == 0 && Vec.crossproduct(qMinusP, r) != 0) {
        // No intersection
        return undefined
    }
    // The two lines intersect if we can find t and u such that: p + t r = q + u s
    // And therefore, solving for t: t = (q − p) × s / (r × s)
    // In the same way, we can solve for u: u = (q − p) × r / (r × s)
    const t = Vec.crossproduct(qMinusP, s) / rCrossS;
    const u = Vec.crossproduct(qMinusP, r) / rCrossS;

    // If r × s ≠ 0 and 0 ≤ t ≤ 1 and 0 ≤ u ≤ 1, the two line segments meet at the point p + t r = q + u s.
    if (rCrossS != 0 && 0 <= t && t <= 1 && 0 <= u && u <= 1) {
        return Vec.add(p, Vec.multiply(t, r))
    }

    // Otherwise, the two line segments are not parallel but do not intersect.
    return undefined
}

export const testables = {
    slope,
    toStandardForm,
    findWherePointIntersectLineAtRightAngle,
    intersectionOfLines
}
