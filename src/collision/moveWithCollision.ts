import type { Vec2 } from "../commonTypes";
import { distance } from "../math";
import { findWherePointIntersectLineSegmentAtRightAngle, LineSegment } from "./collisionMath";

export interface Circle {
    position: Vec2;
    radius: number;
}
export function isCircleIntersectingCircle(c1: Circle, c2: Circle): boolean {
    return distance(c1.position, c2.position) <= c1.radius + c2.radius;
}
// Given a position ("from"), inside a circle, move the circle away from the position "from",
// until "from" is at the edge of the cricle.
// The circle moves in the vector of "from" to circle.position
export function moveAwayFrom(circle: Circle, from: Vec2) {
    const bigA = from.x - circle.position.x;
    const bigB = from.y - circle.position.y;
    const bigC = Math.sqrt(bigA * bigA + bigB * bigB);
    // little "a" and little "b" represent the normalized vector of movement
    const a = bigA / bigC;
    const b = bigB / bigC;
    const moveDistance = circle.radius - bigC;
    // Simply multiply the normalized vector of movement (a,b)
    // against the move distance to determine the final position
    circle.position.x -= a * moveDistance;
    circle.position.y -= b * moveDistance;
}
// Returns a new coordinate represending "startPos" moved "distance" along "normalizedVector"
// Pure Function
export function moveAlongVector(startPos: Vec2, normalizedVector: Vec2, distance: number): Vec2 {
    return {
        x: startPos.x + normalizedVector.x * distance,
        y: startPos.y + normalizedVector.y * distance,
    }
}
// Get a normalized vector and distance between two points
// (this distance is a bonus since it needs to be calculated anyway, might as well return it)
// Pure Function
export function normalizedVector(point1: Vec2, point2: Vec2): { vector: Vec2 | undefined, distance: number } {
    const bigA = point2.x - point1.x;
    const bigB = point2.y - point1.y;
    const bigC = Math.sqrt(bigA * bigA + bigB * bigB);
    if (bigC === 0) {
        return { vector: undefined, distance: 0 }
    }
    // little "a" and little "b" represent the normalized vector of movement
    const a = bigA / bigC;
    const b = bigB / bigC;
    // Return the normalized vector and the distance between the two points
    return { vector: { x: a, y: b }, distance: bigC };
}

// move moves a mover towards the destination but will consider
// collisions with circles and eventaully lines.  Collisions may cause
// both colliders to move
// mover may not end up at destination if it collides
export function moveWithCollisions(mover: Circle, destination: Vec2, circles: Circle[]) {
    // Determine if the mover intersects with any "circles" as
    // it travels from mover.position to destination
    // We do this by adding mover.radius to the other circle's radius
    // and testing for intersection between that circle at the line segment
    // of mover's movement

    const originalPosition = { x: mover.position.x, y: mover.position.y };
    // Actually move the mover
    mover.position = destination;
    for (let other of circles) {
        // Do not repel self
        if (mover !== other) {
            repelCircles(mover, originalPosition, other);
        }
    }
}
// repelCircles moves two intersecting circles away from each other
// relative to their distance from each other and radius.
// mover: the circle that is initiating movement
// originalPosition: the original position of mover, mover should already be moved to the destination that may cause collision
// other: the circle that mover may be colliding with
// otherIsFixed: true if other should not be moved when collision occurs.  In that case only mover is moved due to the collision
// Note: this function is only meant to handle small increments of movements, this function
// will not account for the case where the destination does not intersect
// a circle but the mover would travel through a circle on it's way to destination.  This is by design.
function repelCircles(mover: Circle, originalPosition: Vec2, other: Circle, otherIsFixed: boolean = false) {
    // If the mover now intersects with another circle...
    if (isCircleIntersectingCircle(mover, other)) {
        // Repel, so they don't intersect
        // Circles should move mover.radius/2 + other.radius/2 away from each others
        // positions
        let { vector, distance } = normalizedVector(mover.position, other.position);
        if (!vector) {
            // If vector is undefined, then mover.position and other.position are
            // equal, in which case we should determien the vector from the 
            // mover's start point:
            vector = normalizedVector(originalPosition, other.position).vector;
        }
        if (vector) {
            const overlap = mover.radius + other.radius - distance;
            if (otherIsFixed) {
                mover.position = moveAlongVector(mover.position, vector, -overlap);
            } else {
                const moveDistance = overlap / 2;
                // Use a negative moveDistance for mover to move in the opposite direction of vector
                mover.position = moveAlongVector(mover.position, vector, -moveDistance);
                other.position = moveAlongVector(other.position, vector, moveDistance);
            }
        } else {
            // If vector is still undefined after trying both the new point and the start point
            // then we need not calculate any collision or movement because the mover isn't moving
            // --
            // return early
            return
        }
    }
}
// moveWithLineCollisions calculates the final destination of the mover when possibly intersecting
// with fixed line segments.
// Note: this function is only meant to handle small increments of movements, this function
// will not account for the case where the destination does not intersect
// a line but the mover would travel through a linesegment on it's way to destination.  This is by design.
export function moveWithLineCollisions(mover: Circle, destination: Vec2, lines: LineSegment[]) {
    const originalPosition = { x: mover.position.x, y: mover.position.y };
    // Actually move the mover
    mover.position = destination;
    for (let line of lines) {

        // Test for intersection with the line segment
        const rightAngleIntersectionWithLineFromMoverCenterPoint = findWherePointIntersectLineSegmentAtRightAngle(mover.position, line);
        if (rightAngleIntersectionWithLineFromMoverCenterPoint
            && distance(rightAngleIntersectionWithLineFromMoverCenterPoint, mover.position) <= mover.radius) {
            // circle intersects line
            repelCircles(mover, originalPosition, { position: rightAngleIntersectionWithLineFromMoverCenterPoint, radius: 0 }, true);
        }
        // Test for intersection with the line segment endpoints
        if (distance(line.p1, mover.position) <= mover.radius) {
            repelCircles(mover, originalPosition, { position: line.p1, radius: 0 }, true);
        }
        if (distance(line.p2, mover.position) <= mover.radius) {
            repelCircles(mover, originalPosition, { position: line.p2, radius: 0 }, true);
        }

    }
}
export const testables = {
    repelCircles
}