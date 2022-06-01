import * as Image from './Image';
import { Polygon, polygonToPolygonLineSegments } from './Polygon';
import { containerWalls } from './PixiUtils';
import { OBSTACLE_SIZE } from './config';
import type { Vec2 } from './Vec';
import { IUnit, takeDamage } from './Unit';
import { lineSegmentIntersection } from './collision/collisionMath';
import { Material } from './Conway';
export interface IObstacle {
  x: number;
  y: number;
  name: string;
  description: string;
  imagePath: string;
  bounds: Polygon;
  material: Material;
}
interface IObstacleSource {
  name: string;
  description: string;
  imagePath: string;
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
export function create(coord: Vec2, biome: Biome, material: Material) {
  if (material == Material.WALL || material == Material.LIQUID) {
    const obstacle = biome[material];
    if (obstacle) {
      const bounds = coordToPoly(coord);
      const self: IObstacle = {
        x: coord.x,
        y: coord.y,
        name: obstacle.name,
        description: obstacle.description,
        imagePath: obstacle.imagePath,
        bounds,
        material
      };
      return self;
    } else {
      throw new Error(`No obstacle found at material ${material}`)
    }
  } else {
    throw new Error(`Material ${material} cannot be used to create an obstacle`);
  }
}
export function addImageForObstacle(obstacle: IObstacle) {
  Image.create(obstacle, obstacle.imagePath, containerWalls);

}
interface Biome {
  [Material.WALL]: IObstacleSource,
  [Material.LIQUID]: IObstacleSource,
}
export const biomes: Biome[] = [
  {
    [Material.WALL]: {
      name: 'Wall',
      description: 'This is a wall that will block your way.',
      imagePath: 'tiles/wall.png',
    },
    [Material.LIQUID]: {
      // Note: The exact name 'Lava" is used in underworld.cacheWalls to store obstacles
      // that cause damage is units are pushed or pulled into them.
      name: 'Lava',
      description: 'Blocks movement, not sight.',
      imagePath: 'tiles/lava.png',
    },

  }
];

export const obstacleSource: IObstacleSource[] = [
];
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