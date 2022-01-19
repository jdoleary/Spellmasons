import type { Coords } from "../commonTypes";
import { distance, normalizeRadians } from "../math";

export interface Circle {
    position: Coords;
    radius: number;
}
export function isCircleIntersectingCircle(c1: Circle, c2: Circle): boolean {
    return distance(c1.position, c2.position) <= c1.radius + c2.radius;
}
// Given a position ("from"), inside a circle, move the circle away from the position "from",
// until "from" is at the edge of the cricle.
// The circle moves in the vector of "from" to circle.position
export function moveAwayFrom(circle: Circle, from: Coords) {
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
export function moveAlongVector(startPos: Coords, normalizedVector: Coords, distance: number): Coords {
    return {
        x: startPos.x + normalizedVector.x * distance,
        y: startPos.y + normalizedVector.y * distance,
    }
}
// Get a normalized vector and distance between two points
// (this distance is a bonus since it needs to be calculated anyway, might as well return it)
// Pure Function
export function normalizedVector(point1: Coords, point2: Coords): { vector: Coords | undefined, distance: number } {
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
export function move(mover: Circle, destination: Coords, circles: Circle[]) {
    // Determine if the mover intersects with any "circles" as
    // it travels from mover.position to destination
    // We do this by adding mover.radius to the other circle's radius
    // and testing for intersection between that circle at the line segment
    // of mover's movement

    // Actually move the mover
    const originalPosition = { x: mover.position.x, y: mover.position.y };
    mover.position = destination;
    for (let other of circles) {
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
                const moveDistance = overlap / 2;
                // Use a negative moveDistance for mover to move in the opposite direction of vector
                mover.position = moveAlongVector(mover.position, vector, -moveDistance);
                other.position = moveAlongVector(other.position, vector, moveDistance);
            } else {
                // If vector is still undefined after trying both the new point and the start point
                // then we need not calculate any collision or movement because the mover isn't moving
                // --
                // return early
                return
            }
        }
    }

}