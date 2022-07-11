import { magnitude, Vec2 } from './Vec';
import { prng, randInt } from './rand';
// https://webdva.github.io/how-i-implemented-client-side-linear-interpolation/
export function lerp(start: number, end: number, time: number) {
  if (time >= 1) {
    return end;
  }
  if (time <= 0) {
    return start;
  }
  return start * (1 - time) + end * time;
}

// For a triangle with sides x,y, and d (desired distance / hypotenuse), find the value
// of x and y given a known h and a known similar triangle of X,Y, and D (distance / hypotenuse)
export function similarTriangles(X: number, Y: number, D: number, d: number): Vec2 {
  if (D === 0 || d === 0) {
    return { x: 0, y: 0 };
  }
  const hypotenuseRatio = d / D;
  return {
    x: hypotenuseRatio * X,
    y: hypotenuseRatio * Y
  }
}

// getCoordsAtDistanceTowardsTarget is used, for example, to move 'travelDist' distance across
// the vector 'start' to 'end'
// --
// hint: Use a negative length to move away from target
export function getCoordsAtDistanceTowardsTarget(start: Vec2, target: Vec2, travelDist: number): Vec2 {
  const distanceBetweenPoints = distance(start, target);
  // Travel at most length, however, don't move beyond target
  if (travelDist >= distanceBetweenPoints) {
    return target;
  }
  const result = similarTriangles(target.x - start.x, target.y - start.y, distanceBetweenPoints, travelDist)
  return {
    x: start.x + result.x,
    y: start.y + result.y
  }
}

export function distance(coords1: Vec2, coords2: Vec2): number {
  return Math.sqrt(
    Math.pow(coords2.x - coords1.x, 2) + Math.pow(coords2.y - coords1.y, 2),
  );
}


// Generates a honeycomb of circles of radius, never intersecting.
// Used for finding points to test for valid spawn
// Note, Y is inverted so that +y is "down" because of how pixi draws
export function* honeycombGenerator(radius: number, start: Vec2, loopLimit: number): Generator<Vec2> {
  // Starting point for a loop is always down right * 2radius * loop

  // Skip the start point
  for (let i = 1; i < loopLimit; i++) {
    let lastPoint = { x: start.x + i * 2 * radius, y: start.y + i * radius }
    yield lastPoint;
    // From last point:
    // Left Down x loop
    for (let j = 0; j < i; j++) {
      lastPoint = { x: lastPoint.x - 2 * radius, y: lastPoint.y + radius };
      yield lastPoint;
    }
    // Left Up x loop
    for (let j = 0; j < i; j++) {
      lastPoint = { x: lastPoint.x - 2 * radius, y: lastPoint.y - radius };
      yield lastPoint;
    }
    // Up * loop
    for (let j = 0; j < i; j++) {
      lastPoint = { x: lastPoint.x, y: lastPoint.y - 2 * radius };
      yield lastPoint;
    }
    // Right Up * loop
    for (let j = 0; j < i; j++) {
      lastPoint = { x: lastPoint.x + 2 * radius, y: lastPoint.y - radius };
      yield lastPoint;
    }
    // Right down * loop
    for (let j = 0; j < i; j++) {
      lastPoint = { x: lastPoint.x + 2 * radius, y: lastPoint.y + radius };
      yield lastPoint;
    }
    // Down * (loop -1)
    for (let j = 0; j < i - 1; j++) {
      lastPoint = { x: lastPoint.x, y: lastPoint.y + 2 * radius };
      yield lastPoint;
    }
  }

}