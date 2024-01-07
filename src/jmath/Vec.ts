
import { LineSegment } from "./lineSegment";
import { distance, similarTriangles, lerp } from "./math";
import { prng, randInt } from "./rand";
export interface Vec2 {
  x: number;
  y: number;
}

// TODO - see comment below and getAngleBetween functions
// would be good to fix after 1.27

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
export function lerpVec2(p1: Vec2, p2: Vec2, t: number): Vec2 {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
  }
}
// jitter returns a new Vec2 which is the original pos
// moved randomly capped by maxJitter
export function jitter(pos: Vec2, maxJitter: number, random?: prng): Vec2 {
  const jitterX = randInt(-maxJitter, maxJitter, random);
  const jitterY = randInt(-maxJitter, maxJitter, random);
  return add(pos, { x: jitterX, y: jitterY });
}
// returns a random Vec2 with x and y capped between min and max inclusive
export function random(min: number, max: number, random?: prng): Vec2 {
  return { x: randInt(min, max, random), y: randInt(min, max, random) };
}
// Returns a scalar
// Function to calculate the cross product of two 2D vectors
export function crossProduct(v1: Vec2, v2: Vec2): number {
  return v1.x * v2.y - v1.y * v2.x;
}
// Returns a scalar
// Function to calculate the dot product of two 2D vectors
export function dotProduct(v1: Vec2, v2: Vec2): number {
  return v1.x * v2.x + v1.y * v2.y;
}
// The direction a line moves from point 1 to point 2
export function getDirectionVector(segment: LineSegment): Vec2 {
  return { x: segment.p2.x - segment.p1.x, y: segment.p2.y - segment.p1.y }
}
// The line perpendicular to a wall, facing inward
export function getNormalVector(segment: LineSegment): Vec2 {
  const directionVector = getDirectionVector(segment);
  const normalVector = { x: -directionVector.y, y: directionVector.x };
  return normalized(normalVector);
}
// Like a laser against a mirror
// Normal must be normalized before passing it here
export function reflectOnNormal(v: Vec2, normal: Vec2): Vec2 {
  const dotProd = dotProduct(v, normal);
  const scaledNormal = multiply(2 * dotProd, normal);
  return subtract(v, scaledNormal);
}
// Like a heavy box hitting a wall and continuing to slide parallel to it
// Normal must be normalized before passing it here
export function projectOnNormal(v: Vec2, normal: Vec2): Vec2 {
  const scalar = dotProduct(v, normal) / dotProduct(normal, normal);
  return multiply(scalar, normal);
}
// Magnitude without the sqrt() function - Use when performance is a concern
// When comparing the length of two vectors, compare sqrMagnitudes
// When comparing to a distance, use (sqrMagnitude > sqrDistance)
// *or to (distance * distance) where distance is a constant
// ... instead of (magnitude to magnitude) or (magnitude to distance)
export function sqrMagnitude(p: Vec2): number {
  return p.x * p.x + p.y * p.y;
}
// Magnitude of a vector
export function magnitude(p: Vec2): number {
  return Math.sqrt(sqrMagnitude(p));
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
export function normalized(vector: Vec2): Vec2 {
  const m = magnitude(vector);
  if (m !== 0) {
    return { x: vector.x / m, y: vector.y / m };
  } else {
    // Handle the case where the vector has zero magnitude
    return { x: 0, y: 0 }
  };
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