import * as Image from './Image';
import { Polygon, polygonToPolygonLineSegments } from './Polygon';
import { containerWalls } from './PixiUtils';
import { OBSTACLE_SIZE } from './config';
import type { Vec2 } from './Vec';
import { IUnit, takeDamage } from './Unit';
import { lineSegmentIntersection } from './collision/lineSegment';
import { Material } from './Conway';
export interface IObstacle {
  x: number;
  y: number;
  bounds: Polygon;
  material: Material;
}

export function coordToPoly(coord: Vec2, inverted: boolean = false): Polygon {
  const width = OBSTACLE_SIZE;
  const height = OBSTACLE_SIZE;
  const _x = coord.x - width / 2;
  const _y = coord.y - height / 2;
  const bounds = {
    points: [
      { x: _x, y: _y },
      { x: _x, y: _y + height },
      { x: _x + width, y: _y + height },
      { x: _x + width, y: _y },
    ], inverted
  };
  return bounds;
}

export const lavaDamage = 2;
export function checkLavaDamageDueToMovement(unit: IUnit, endPos: Vec2, prediction: boolean) {
  // Check intersections with lava:
  let hitLava = false;
  for (let o of window.underworld.lavaObstacles) {
    const walls = polygonToPolygonLineSegments(o.bounds);
    for (let wall of walls) {
      if (lineSegmentIntersection({ p1: unit, p2: endPos }, wall)) {
        hitLava = true;
        break;
      }
    }
    if (hitLava) {
      break;
    }
  }
  const predictionColor = hitLava ? 0xff0000 : 0x0000ff;
  window.predictionGraphics.lineStyle(4, predictionColor, 1.0)
  window.predictionGraphics.moveTo(unit.x, unit.y);
  window.predictionGraphics.lineTo(endPos.x, endPos.y);
  window.predictionGraphics.drawCircle(endPos.x, endPos.y, 4);
  if (hitLava) {
    if (!prediction) {
      // Add a timeout because the pull happens over time and this executes
      // immediately. This is kindof a cheat way to wait to show the lava icon
      // until the unit collides with the lava obstacle; however it doesn't actually
      // wait for the collision, it just knows it will happen so it shows the effect 
      // after a delay
      setTimeout(() => {
        window.underworld.animateSpell(unit, 'tiles/lava.png');
      }, 500);
    }
    takeDamage(unit, lavaDamage, prediction);
  }

}