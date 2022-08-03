import { OBSTACLE_SIZE } from '../config';
import { Vec2, subtract, magnitude, add, clone } from '../jmath/Vec';
import { isUnit, IUnit, takeDamage } from './Unit';
import { closestLineSegmentIntersectionWithLine, isOnOutside, lineSegmentIntersection } from '../jmath/lineSegment';
import { Material } from '../Conway';
import { isVec2InsidePolygon, Polygon2 } from '../jmath/Polygon2';
import { distance, similarTriangles } from '../jmath/math';
import { addMask, removeMask } from '../graphics/Image';
import { ForceMove } from '../jmath/moveWithCollision';
import Underworld from '../Underworld';
export interface IObstacle {
  x: number;
  y: number;
  bounds: Polygon2;
  material: Material;
}

export function coordToPoly(coord: Vec2): Polygon2 {
  const width = OBSTACLE_SIZE;
  const height = OBSTACLE_SIZE;
  const _x = coord.x - width / 2;
  const _y = coord.y - height / 2;
  const bounds = [
    { x: _x, y: _y },
    { x: _x, y: _y + height },
    { x: _x + width, y: _y + height },
    { x: _x + width, y: _y },
  ]

  return bounds;
}

export const lavaDamage = 2;
export function checkLiquidInteractionDueToForceMovement(forceMoveInst: ForceMove, lastPosition: Vec2, underworld: Underworld, prediction: boolean) {
  if (isUnit(forceMoveInst.pushedObject)) {
    const unit = forceMoveInst.pushedObject;
    checkLiquidInteractionDueToMovement(unit, lastPosition, underworld, prediction);
  }
}
// Returns a point that would be "safe" to move a unit to where visually they would be completely submerged in liquid.
// "safe" meaning visually safe so it doesn't look buggy where they are half submerged but also half on land
export function findSafeFallInPoint(currentPosition: Vec2, nextPosition: Vec2, underworld: Underworld): { safeFallInPosition: Vec2, hitLava: boolean } {
  let liquidMovedUnit = false;
  // Check intersections with lava:
  let hitLava = false;
  const fallInThreshold = 10;
  // + 10 gives a margin so that they don't just fall right back out.
  const fallInDistance = fallInThreshold + 10;
  let safeFallInPosition = clone(currentPosition);
  const intersectionInfo = closestLineSegmentIntersectionWithLine({ p1: currentPosition, p2: nextPosition }, underworld.liquidBounds)
  if (intersectionInfo) {
    const { intersection, lineSegment: liquidBoundary } = intersectionInfo;
    if (globalThis.devDebugGraphics) {
      globalThis.devDebugGraphics.lineStyle(2, 0x0000ff, 1.0);
      globalThis.devDebugGraphics.drawCircle(intersection.x, intersection.y, 10);
    }

    const dist = distance(nextPosition, intersection);
    let fallInPoint = similarTriangles(nextPosition.x - intersection.x, nextPosition.y - intersection.y, dist, fallInDistance)
    // Edge case: If unit is closer than fallInThreshold from endpoint of wall
    // and the wall is connected to another wall by a right angle, when they
    // "fall in", they will immediately come back out in a perpendicular direction
    // because they fell in within the fall out threshold of the other wall.
    // Ensure that if they fall in they are at least fallInThreshold away from other
    // walls too.
    const diffFromP1 = subtract(intersection, liquidBoundary.p1);
    const diffFromP2 = subtract(intersection, liquidBoundary.p2);
    const isOutside = isOnOutside(liquidBoundary, currentPosition);
    if (isOutside && magnitude(diffFromP1) <= fallInThreshold) {
      const deltaX = liquidBoundary.p1.x - liquidBoundary.p2.x;
      const deltaY = liquidBoundary.p1.y - liquidBoundary.p2.y;
      const fromCorner = similarTriangles(deltaX, deltaY, magnitude(subtract(liquidBoundary.p1, liquidBoundary.p2)), fallInDistance)
      const fallInThresholdProjectedFromWallP1toWallP2 = subtract(liquidBoundary.p1, fromCorner);
      // Rotate vector 90 degrees https://stackoverflow.com/a/4780141/4418836
      safeFallInPosition = add(fallInThresholdProjectedFromWallP1toWallP2, { x: -fromCorner.y, y: fromCorner.x });
    } else if (isOutside && magnitude(diffFromP2) <= fallInThreshold) {
      const deltaX = liquidBoundary.p2.x - liquidBoundary.p1.x;
      const deltaY = liquidBoundary.p2.y - liquidBoundary.p1.y;
      const fromCorner = similarTriangles(deltaX, deltaY, magnitude(subtract(liquidBoundary.p2, liquidBoundary.p1)), fallInDistance)
      const fallInThresholdProjectedFromWallP2toWallP1 = subtract(liquidBoundary.p2, fromCorner);
      safeFallInPosition = add(fallInThresholdProjectedFromWallP2toWallP1, { x: fromCorner.y, y: -fromCorner.x });
    } else {
      safeFallInPosition.x = intersection.x + fallInPoint.x;
      safeFallInPosition.y = intersection.y + fallInPoint.y;
    }
    liquidMovedUnit = true;

    hitLava = !isOnOutside(liquidBoundary, safeFallInPosition);
  }
  if (globalThis.devDebugGraphics) {

    globalThis.devDebugGraphics.lineStyle(2, 0xffffff, 1.0);
    globalThis.devDebugGraphics.moveTo(nextPosition.x, nextPosition.y);
    globalThis.devDebugGraphics.lineTo(currentPosition.x, currentPosition.y);
    if (hitLava) {
      globalThis.devDebugGraphics.lineStyle(2, 0xff0000, 1.0);
    }
    globalThis.devDebugGraphics.drawCircle(safeFallInPosition.x, safeFallInPosition.y, 10);
  }
  return { safeFallInPosition, hitLava };


}
// Invoked manually when a unit moves due to forced movement (non pathing movement)
// to check to see if they "fall in" to liquid
// Returns true if their position changed due to liquid interaction
export function checkLiquidInteractionDueToMovement(unit: IUnit, lastPosition: Vec2, underworld: Underworld, prediction: boolean): boolean {
  let liquidMovedUnit = false;
  // Check intersections with lava:
  let hitLava = false;
  const fallInThreshold = 10;
  // + 10 gives a margin so that they don't just fall right back out.
  const fallInDistance = fallInThreshold + 10;
  for (let wall of underworld.liquidBounds) {
    const intersection = lineSegmentIntersection({ p1: unit, p2: lastPosition }, wall);
    if (intersection) {

      const dist = distance(lastPosition, intersection);
      let fallInPoint = similarTriangles(intersection.x - lastPosition.x, intersection.y - lastPosition.y, dist, fallInDistance)
      // Edge case: If unit is closer than fallInThreshold from endpoint of wall
      // and the wall is connected to another wall by a right angle, when they
      // "fall in", they will immediately come back out in a perpendicular direction
      // because they fell in within the fall out threshold of the other wall.
      // Ensure that if they fall in they are at least fallInThreshold away from other
      // walls too.
      const diffFromP1 = subtract(intersection, wall.p1);
      const diffFromP2 = subtract(intersection, wall.p2);
      const isOutside = isOnOutside(wall, lastPosition);
      if (isOutside && magnitude(diffFromP1) <= fallInThreshold) {
        const deltaX = wall.p1.x - wall.p2.x;
        const deltaY = wall.p1.y - wall.p2.y;
        const fromCorner = similarTriangles(deltaX, deltaY, magnitude(subtract(wall.p1, wall.p2)), fallInDistance)
        const fallInThresholdProjectedFromWallP1toWallP2 = subtract(wall.p1, fromCorner);
        // Rotate vector 90 degrees https://stackoverflow.com/a/4780141/4418836
        const safeFallInPosition = add(fallInThresholdProjectedFromWallP1toWallP2, { x: -fromCorner.y, y: fromCorner.x });
        unit.x = safeFallInPosition.x;
        unit.y = safeFallInPosition.y;
      } else if (isOutside && magnitude(diffFromP2) <= fallInThreshold) {
        const deltaX = wall.p2.x - wall.p1.x;
        const deltaY = wall.p2.y - wall.p1.y;
        const fromCorner = similarTriangles(deltaX, deltaY, magnitude(subtract(wall.p2, wall.p1)), fallInDistance)
        const fallInThresholdProjectedFromWallP2toWallP1 = subtract(wall.p2, fromCorner);
        const safeFallInPosition = add(fallInThresholdProjectedFromWallP2toWallP1, { x: fromCorner.y, y: -fromCorner.x });
        unit.x = safeFallInPosition.x;
        unit.y = safeFallInPosition.y;
      } else {
        unit.x = intersection.x + fallInPoint.x;
        unit.y = intersection.y + fallInPoint.y;
      }
      liquidMovedUnit = true;

      unit.resolveDoneMoving();
      hitLava = !isOnOutside(wall, unit);
      if (hitLava) {
        takeDamage(unit, lavaDamage, underworld, prediction);
        if (unit.image) {
          addMask(unit.image, 'liquid-mask');
        }
      }
      // Since unit has "fallen in", break out of for loop so that they don't fall back out
      // which can occur if they fall in near a corner
      break;
    }
  }
  if (underworld.liquidPolygons.length) {
    let insideLiquid = false;
    for (let poly of underworld.liquidPolygons) {
      insideLiquid = isVec2InsidePolygon(unit, poly);
      if (insideLiquid) {
        break;
      }
    }
    if (!insideLiquid) {
      if (unit.image) {
        removeMask(unit.image);
      }
    }
  }
  const predictionColor = hitLava ? 0xff0000 : 0x0000ff;
  globalThis.predictionGraphics?.lineStyle(4, predictionColor, 1.0)
  globalThis.predictionGraphics?.moveTo(unit.x, unit.y);
  return liquidMovedUnit;

}