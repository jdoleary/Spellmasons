import { add, getDirectionVector, getNormalVector, magnitude, multiply, normalized, projectOnNormal, reflectOnNormal, subtract, Vec2 } from './Vec';
import { distance, similarTriangles } from "./math";
import { closestLineSegmentIntersection, findWherePointIntersectLineSegmentAtRightAngle, LineSegment, lineSegmentIntersection } from "./lineSegment";
import * as config from '../config';
import * as math from './math';
import Underworld from '../Underworld';
import { HasSpace } from '../entity/Type';
import { IUnit } from '../entity/Unit';
import { IPickup } from '../entity/Pickup';
export enum ForceMoveType {
  PROJECTILE,
  UNIT_OR_PICKUP
}
export interface ForceMove {
  type: ForceMoveType;
  pushedObject: HasSpace;
  velocity: Vec2;
  timedOut?: boolean;
}
export type ForceMoveUnitOrPickup = ForceMove & {
  type: ForceMoveType.UNIT_OR_PICKUP;
  canCreateSecondOrderPushes: boolean;
  velocity_falloff: number;
  // A list of other HasSpace entities that it has already collided with
  alreadyCollided: HasSpace[];
  resolve: () => void;
}
export function isForceMoveUnitOrPickup(x: ForceMove): x is ForceMoveUnitOrPickup {
  return x.type == ForceMoveType.UNIT_OR_PICKUP;
}
export type ForceMoveProjectile = ForceMove & {
  type: ForceMoveType.PROJECTILE;
  startPoint: Vec2;
  endPoint: Vec2;
  doesPierce: boolean;
  ignoreUnitIds: number[];
  collideFnKey: string;
}
export function isForceMoveProjectile(x: ForceMove): x is ForceMoveProjectile {
  return x.type == ForceMoveType.PROJECTILE;
}

interface ForceMoveProjectileArgs {
  pushedObject: HasSpace;
  startPoint: Vec2;
  endPoint: Vec2;
  doesPierce: boolean;
  ignoreUnitIds: number[];
  collideFnKey: string;
}
const START_VELOCITY = 1.5;
export function makeForceMoveProjectile(args: ForceMoveProjectileArgs, underworld: Underworld, prediction: boolean): ForceMove {
  const { pushedObject, startPoint, endPoint, doesPierce, ignoreUnitIds, collideFnKey } = args;
  const velocity = similarTriangles(endPoint.x - pushedObject.x, endPoint.y - pushedObject.y, distance(pushedObject, endPoint), START_VELOCITY);
  pushedObject.beingPushed = true;
  // Experiment: canCreateSecondOrderPushes now is ALWAYS disabled.
  // I've had feedback that it's suprising - which is bad for a tactical game
  // also I suspect it has significant performance costs for levels with many enemies
  const forceMoveInst: ForceMoveProjectile = { type: ForceMoveType.PROJECTILE, collideFnKey, ignoreUnitIds, doesPierce, pushedObject, startPoint, endPoint, velocity };
  underworld.addForceMove(forceMoveInst, prediction);
  return forceMoveInst;

}
// Circle is used exclusively for force move objects
export type Circle = {
  radius: number;
} & Vec2;
export function isVecIntersectingVecWithCustomRadius(c1: Vec2, c2: Vec2, radius: number): boolean {
  return distance(c1, c2) <= radius;
}
export function isCircleIntersectingCircle(c1: Circle, c2: Circle): boolean {
  return distance(c1, c2) <= c1.radius + c2.radius;
}
// Given a position ("from"), inside a circle, move the circle away from the position "from",
// until "from" is at the edge of the cricle.
// The circle moves in the vector of "from" to circle
export function moveAwayFrom(circle: Circle, from: Vec2) {
  const bigA = from.x - circle.x;
  const bigB = from.y - circle.y;
  const bigC = Math.sqrt(bigA * bigA + bigB * bigB);
  // little "a" and little "b" represent the normalized vector of movement
  const a = bigA / bigC;
  const b = bigB / bigC;
  const moveDistance = circle.radius - bigC;
  // Simply multiply the normalized vector of movement (a,b)
  // against the move distance to determine the final position
  circle.x -= a * moveDistance;
  circle.y -= b * moveDistance;
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
// Returns true if collision occurred
export function collideWithLineSegments(circle: Circle, lineSegments: LineSegment[], underworld: Underworld): boolean {
  let collisionDidOccur = false;
  for (let line of lineSegments) {
    const collided = repelCircleFromLine(circle, line, underworld);
    if (collided) {
      collisionDidOccur = true;
    }
  }
  return collisionDidOccur;
}

// Prevents force move through walls and
// returns some collision info
export function predictWallCollision(forceMoveInst: ForceMove, underworld: Underworld, deltaTime: number): { msUntilCollision: number, wall: LineSegment | undefined } {
  const { pushedObject, velocity } = forceMoveInst;
  const deltaPosition = multiply(deltaTime, velocity);
  // TODO - I think this could be optimized with SimilarTriangles
  // or removed entirely with the todo below?
  const farIntersection = add(pushedObject, multiply(magnitude(deltaPosition) + config.COLLISION_MESH_RADIUS, normalized(deltaPosition)));

  for (const wall of underworld.walls) {
    const intersection = lineSegmentIntersection({ p1: pushedObject, p2: farIntersection }, wall);
    if (intersection) {
      // TODO - Should factor in sin(angleBetween(velocity, getNormalVector(wall))) or something like that
      // if we want to remove collideWithLineSegments as talked about in Underworld.runForceMove
      const newPos = math.getCoordsAtDistanceTowardsTarget(intersection, pushedObject, config.COLLISION_MESH_RADIUS);
      const msUntilCollision = distance(pushedObject, newPos) / magnitude(velocity);
      pushedObject.x = newPos.x;
      pushedObject.y = newPos.y;
      return { msUntilCollision, wall };
    }
  }
  // No collision
  return { msUntilCollision: -1, wall: undefined };
}
export function projectVelocityAlongWall(velocity: Vec2, lineSegment: LineSegment): Vec2 {
  // We want to use the direction vector instead of normal here
  // that way the velocity is projected "along" the wall instead of away
  const projection = projectOnNormal(velocity, getDirectionVector(lineSegment));
  // projection factor is a number 0-1 that controls
  // the magnitude of the projection relative to the velocity
  //const projectionFactor = getAngleBetweenVec2s(velocity, projection) / (Math.PI);
  const projectionFactor = 1;
  return multiply(projectionFactor, projection);
}
export function reflectVelocityOnWall(velocity: Vec2, lineSegment: LineSegment): Vec2 {
  // We want to use the normal vector here
  // that way the velocity reflected away from the wall
  const reflection = reflectOnNormal(velocity, getNormalVector(lineSegment));
  // reflection factor is a number 0-1 that controls
  // the magnitude of the reflection relative to the velocity
  //const reflectionFactor = getAngleBetweenVec2s(velocity, reflection) / (Math.PI);
  const reflectionFactor = 1;
  return multiply(reflectionFactor, reflection);
}
// move moves a mover towards the destination but will consider
// collisions with circles and eventaully lines.  Collisions may cause
// both colliders to move
// mover may not end up at destination if it collides
export function moveWithCollisions(mover: Circle, destination: Vec2, circles: HasSpace[], underworld: Underworld) {
  // Determine if the mover intersects with any "circles" as
  // it travels from mover to destination
  // We do this by adding mover.radius to the other circle's radius
  // and testing for intersection between that circle at the line segment
  // of mover's movement

  // Actually move the mover
  mover.x = destination.x;
  mover.y = destination.y;

  const originalPosition = { x: mover.x, y: mover.y };
  for (let other of circles) {
    // Do not repel self from self
    if (mover !== other) {
      // If the mover now intersects with another circle...
      if (isCircleIntersectingCircle(mover, other)) {
        repelCircles(mover, originalPosition, other, underworld, other.immovable);
      }
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
function repelCircles(mover: Circle, originalPosition: Vec2, other: Circle, underworld: Underworld, otherIsFixed: boolean = false) {
  // Repel, so they don't intersect
  // Circles should move mover.radius/2 + other.radius/2 away from each others
  // positions
  let { vector, distance } = normalizedVector(mover, other);
  if (!vector) {
    // If vector is undefined, then mover and other are
    // equal, in which case we should determien the vector from the 
    // mover's start point:
    vector = normalizedVector(originalPosition, other).vector;
  }
  if (vector) {
    const overlap = mover.radius + other.radius - distance;
    // Prevent "pulling" circles towards each other, this function
    // will only repel if they are intersecting (which would mean "overlap"
    // would be a non-zero positive number)
    if (overlap > 0) {
      if (otherIsFixed) {
        const moverPos = moveAlongVector(mover, vector, -overlap);
        const intersection = closestLineSegmentIntersection({ p1: mover, p2: moverPos }, underworld.pathingLineSegments);
        if (intersection) {
          mover.x = intersection.x;
          mover.y = intersection.y;
        } else {
          mover.x = moverPos.x;
          mover.y = moverPos.y;
        }
      } else {
        const otherPos = moveAlongVector(other, vector, overlap);
        const intersection = closestLineSegmentIntersection({ p1: other, p2: otherPos }, underworld.pathingLineSegments);
        if (intersection) {
          other.x = intersection.x;
          other.y = intersection.y;
        } else {
          other.x = otherPos.x;
          other.y = otherPos.y;
        }
      }
    }
  } else {
    // If vector is still undefined after trying both the new point and the start point
    // then we need not calculate any collision or movement because the mover isn't moving
    // --
    // return early
    return
  }
}
// repelCircleFromLine calculates the final destination of the mover when possibly intersecting
// with fixed line segments.
// Note: this function is only meant to handle small increments of movements, this function
// will not account for the case where the destination does not intersect
// a line but the mover would travel through a linesegment on it's way to destination.  This is by design.
// Returns true if collision and repulsion occurred
function repelCircleFromLine(mover: Circle, line: LineSegment, underworld: Underworld): boolean {
  let repelled = false;
  // The radius used for the line points makes up the different between a regular unit collision radius and the units physicsMover's radius
  // The units physicsMover's radius is small so that units can "squeeze" past each other, but I want the full unit size to collide
  // with walls (lines and their verticies).
  const totalRepelDistance = config.COLLISION_MESH_RADIUS * config.NON_HEAVY_UNIT_SCALE;
  // Test for intersection with the line segment
  // globalThis.unitOverlayGraphics.lineStyle(4, 0xff0000, 1);
  // const midPoint = add(line.p1, similarTriangles(line.p2.x - line.p1.x, line.p2.y - line.p1.y, distance(line.p1, line.p2), distance(line.p1, line.p2) / 2))
  // globalThis.unitOverlayGraphics.moveTo(midPoint.x, midPoint.y);
  // globalThis.unitOverlayGraphics.lineTo(midPoint.x + repelVector.x, midPoint.y + repelVector.y);
  const rightAngleIntersectionWithLineFromMoverCenterPoint = findWherePointIntersectLineSegmentAtRightAngle(mover, line);
  if (rightAngleIntersectionWithLineFromMoverCenterPoint
    && distance(rightAngleIntersectionWithLineFromMoverCenterPoint, mover) <= totalRepelDistance) {
    // Option 1: This way of calculating repelVector supports the greatest distance, where if any part of 
    // the circle with a radius of totalRepelDistance (instead of the circle's radius, this is overridden on purpose
    // because units have small radiuses to allow crowding but I want their entire image to be repelled from walls)
    //  touches the line from either side of the line it will repel the mover the entire distance.
    // This is because it is aware of the orientation (the normal vector) of the line
    // However, then it needs to know if the line is inverted or not.  And it is a waste of resources to send the whole polygon over
    // for each PolygonLineSegment in underworld.bounds; so either I could store the inverted property without the polygon
    // or just reverse p1 and p2 or inverted PolygonLineSegments, thus converting them to line segments.
    // const repelVector = multiply(inverted ? -1 : 1, getNormalVectorOfLineSegment(line));
    // Option 2: This way of calculating the repelVector will repel the circle from either side of the line
    // regardless of the normal vector of the line.  This is less forgiving and may allow units to pass through lines
    // easier if they are moving farther in one physics step.
    const repelVector = subtract(mover, rightAngleIntersectionWithLineFromMoverCenterPoint)

    const newLocationRelative = similarTriangles(repelVector.x, repelVector.y, magnitude(repelVector), totalRepelDistance);
    const newLocation = add(rightAngleIntersectionWithLineFromMoverCenterPoint, newLocationRelative);
    mover.x = newLocation.x;
    mover.y = newLocation.y;
    repelled = true;
  }
  // Test for intersection with the line segment endpoints
  if (distance(line.p1, mover) <= totalRepelDistance) {
    // "- mover.radius" is because this needs to repel only the distance from the point to the mover and not consider
    // the movers own radius which would result in jagged "over pushing"
    repelCircles(mover, mover, { ...line.p1, radius: totalRepelDistance - mover.radius }, underworld, true);
    repelled = true;
  }
  if (distance(line.p2, mover) <= totalRepelDistance) {
    // "- mover.radius" is because this needs to repel only the distance from the point to the mover and not consider
    // the movers own radius which would result in jagged "over pushing"
    repelCircles(mover, mover, { ...line.p2, radius: totalRepelDistance - mover.radius }, underworld, true);
    repelled = true;
  }
  return repelled;
}
export const testables = {
  repelCircles,
  repelCircleFromLine
}