import type { Coords } from "../commonTypes";
import { distance } from "../math";

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
export function moveAwayFromToEdgeOfCircle(circle: Circle, from: Coords) {
    const bigA = from.x - circle.position.x;
    const bigB = from.y - circle.position.y;
    const bigC = Math.sqrt(bigA * bigA + bigB * bigB);
    const a = bigA / bigC;
    const b = bigB / bigC;
    const moveDistance = circle.radius - bigC;
    circle.position.x -= a * moveDistance;
    circle.position.y -= b * moveDistance;
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
    mover.position = destination;
    for (let other of circles) {
        // If the mover now intersects with another circle...
        if (isCircleIntersectingCircle(mover, other)) {
            // Repel, so they don't intersect


        }
    }

}