
import { clockwiseAngle } from "./Angle";
import { distance, similarTriangles } from "./math";
import { prng, randInt } from "./rand";
export interface Vec2 {
    x: number;
    y: number;
}

// Get the angle away from the x-axis from origin to point in radians
// Note: This function returns the counter clockwise angle from the x-axis
// of "origin" to "point".  This is tricky because I built Polygons to
// have their "inside" (non-walkable zone) to be filled by iterating
// the polygon verticies in a clockwise direction.  Many of the 
// functions dealing with polygons have to consider clockwise angles between
// points (in order to determine the inside of the polygon).
// So for example, the polygonLineSegment 0,0 to 1,0 has an inside
// angle of 0 to -Math.PI but the angle between those vec2s (in that order)
// would be Math.PI.  This deserves a refactor but I probably wont get to it.
// Keep that in mind when working with polygons
export function getAngleBetweenVec2s(origin: Vec2, point: Vec2): number {
    const dy = point.y - origin.y;
    const dx = point.x - origin.x;
    return Math.atan2(dy, dx);
}
export function getAngleBetweenVec2sYInverted(origin: Vec2, point: Vec2): number {
    const dy = point.y - origin.y;
    const dx = point.x - origin.x;
    return Math.atan2(dy * -1, dx);
}

export function multiply(scalar: number, p2: Vec2): Vec2 {
    return {
        x: scalar * p2.x,
        y: scalar * p2.y
    }
}
export function add(p1: Vec2, p2: Vec2): Vec2 {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    }
}
export function subtract(p1: Vec2, p2: Vec2): Vec2 {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    }
}
// jitter returns a new Vec2 which is the original pos
// moved randomly capped by maxJitter
export function jitter(pos: Vec2, maxJitter: number, random: prng): Vec2 {
    const jitterX = randInt(random, -maxJitter, maxJitter);
    const jitterY = randInt(random, -maxJitter, maxJitter);
    return add(pos, { x: jitterX, y: jitterY });
}
// returns a random Vec2 with x and y capped between min and max inclusive
export function random(min: number, max: number, random: prng): Vec2 {
    return { x: randInt(random, min, max), y: randInt(random, min, max) };
}
// Returns a scalar
export function crossproduct(p1: Vec2, p2: Vec2): number {
    return p1.x * p2.y - p1.y * p2.x;
}
// Returns a scalar
// Source: https://www.cuemath.com/algebra/product-of-vectors/
export function dotProduct(p1: Vec2, p2: Vec2): number {
    const origin = { x: 0, y: 0 };
    const angle = clockwiseAngle(getAngleBetweenVec2s(origin, p1), getAngleBetweenVec2s(origin, p2));
    return magnitude(p1) * magnitude(p2) * Math.cos(angle);
}
export function magnitude(p: Vec2): number {
    return Math.sqrt(p.y * p.y + p.x * p.x);
}

export function equal(p1: Vec2, p2: Vec2): boolean {
    return p1.x == p2.x && p1.y == p2.y;
}

export function clone(p: Vec2): Vec2 {
    return { x: p.x, y: p.y };
}

export function round(v: Vec2): Vec2 {
    return { x: Math.round(v.x), y: Math.round(v.y) };
}
export function invert(v: Vec2): Vec2 {
    return { x: v.y, y: -v.x };
}
// CAUTION: NOT YET TESTED
export function average_mean(vs: Vec2[]) {
    return multiply(1 / vs.length, vs.reduce((acc, cur) => {
        return add(acc, cur)
    }, { x: 0, y: 0 }))
}
// CAUTION: NOT YET TESTED
// Given a position and an angle return the point 
// that results from projecting the position along the angle
// a given magnitude
export function getEndpointOfMagnitudeAlongVector(pos: Vec2, angle: number, magnitude: number): Vec2 {
    const nextPointDirection = { x: pos.x + Math.cos(angle), y: pos.y + Math.sin(angle) };
    const dist = distance(pos, nextPointDirection);
    return add(pos, similarTriangles(nextPointDirection.x - pos.x, nextPointDirection.y - pos.y, dist, magnitude));

}

// Returns true if testPoint is within a bounding box drawn between the two bounding points
export function isBetween(testPoint: Vec2, boundingPoint: Vec2, boundingPoint2: Vec2): boolean {
    const minY = Math.min(boundingPoint.y, boundingPoint2.y);
    const minX = Math.min(boundingPoint.x, boundingPoint2.x);
    const maxY = Math.max(boundingPoint.y, boundingPoint2.y);
    const maxX = Math.max(boundingPoint.x, boundingPoint2.x);
    return minX <= testPoint.x && testPoint.x <= maxX &&
        minY <= testPoint.y && testPoint.y <= maxY;
}

// Clamps a vector to a maximum magnitude
export function clampVector(vector: Vec2, maxMagnitude: number): Vec2 {
    const mag = magnitude(vector)
    if (mag <= maxMagnitude) {
        return vector;
    } else {
        return similarTriangles(vector.x, vector.y, mag, maxMagnitude);
    }
}
export function isInvalid(vector: Vec2 | undefined): boolean {
    return !vector || isNaN(vector.x) || isNaN(vector.y);
}