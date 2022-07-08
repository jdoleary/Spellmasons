import { OBSTACLE_SIZE } from '../config';
import { Vec2, subtract, magnitude, add } from '../mathematics/Vec';
import { IUnit, takeDamage } from './Unit';
import { findWherePointIntersectLineSegmentAtRightAngle, isOnOutside } from '../mathematics/lineSegment';
import { Material } from '../Conway';
import { isVec2InsidePolygon, Polygon2 } from '../mathematics/Polygon2';
import { distance, similarTriangles } from '../mathematics/math';
import { addMask, removeMask } from '../graphics/Image';
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
// Invoked manually when a unit moves due to forced movement (non pathing movement)
// to check to see if they "fall in" to liquid
export function checkLiquidInteractionDueToMovement(unit: IUnit, prediction: boolean) {
  // Check intersections with lava:
  let hitLava = false;
  const fallInThreshold = 10;
  // + 10 gives a margin so that they don't just fall right back out.
  const fallInDistance = fallInThreshold + 10;
  for (let wall of window.underworld.liquidBounds) {
    const intersection = findWherePointIntersectLineSegmentAtRightAngle(unit, wall);
    if (intersection) {

      const dist = distance(unit, intersection);
      if (dist <= fallInThreshold) {
        let fallInPoint = similarTriangles(intersection.x - unit.x, intersection.y - unit.y, dist, fallInDistance)
        // Edge case: If unit is closer than fallInThreshold from endpoint of wall
        // and the wall is connected to another wall by a right angle, when they
        // "fall in", they will immediately come back out in a perpendicular direction
        // because they fell in within the fall out threshold of the other wall.
        // Ensure that if they fall in they are at least fallInThreshold away from other
        // walls too.
        const diffFromP1 = subtract(intersection, wall.p1);
        const diffFromP2 = subtract(intersection, wall.p2);
        const isOutside = isOnOutside(wall, unit);
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
        // Once unit is moved via liquid interations, stop all force movement if unit is under control of force movement:
        // This prevents the issue of a unit moving across liquid and possibly back out due to a single forceMove
        // When the move, if they "fall in", their movement stops
        window.forceMove.forEach(fm => {
          if (fm.pushedObject == unit) {
            window.underworld.removeForceMove(fm);
          }
        });

        unit.resolveDoneMoving();
        hitLava = !isOnOutside(wall, unit);
        if (hitLava) {
          takeDamage(unit, lavaDamage, prediction);
        }
      }
    }
  }
  if (window.underworld.liquidPolygons.length) {
    let insideLiquid = false;
    for (let poly of window.underworld.liquidPolygons) {
      insideLiquid = isVec2InsidePolygon(unit, poly);
      if (insideLiquid) {
        break;
      }
    }
    if (insideLiquid) {
      if (unit.image) {
        addMask(unit.image, 'liquid-mask');
      }
    } else {
      if (unit.image) {
        removeMask(unit.image);
      }

    }
  }
  const predictionColor = hitLava ? 0xff0000 : 0x0000ff;
  window.predictionGraphics.lineStyle(4, predictionColor, 1.0)
  window.predictionGraphics.moveTo(unit.x, unit.y);

}