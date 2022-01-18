export interface Coordinate {
    x: number;
    y: number;
}
export interface Circle {
    position: Coordinate;
    mass: number;
    radius: number;
}
export interface LineSegment {
    p1: Coordinate;
    p2: Coordinate;
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
function intersectionOfLines(line: LineInStandardForm, line2: LineInStandardForm): Coordinate {
    // https://www.cuemath.com/geometry/intersection-of-two-lines/
    return {
        x: (line.b * line2.c - line2.b * line.c) / (line.a * line2.b - line2.a * line.b),
        y: (line.c * line2.a - line2.c * line.a) / (line.a * line2.b - line2.a * line.b),
    }

}
function findWherePointIntersectLineAtRightAngle(point: Coordinate, line: LineInStandardForm): Coordinate {
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
export function findWherePointIntersectLineSegmentAtRightAngle(point: Coordinate, line: LineSegment): Coordinate | undefined {
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
