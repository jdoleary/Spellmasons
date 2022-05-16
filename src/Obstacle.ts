import * as Image from './Image';
import type { Polygon } from './Polygon';
import { containerUnits } from './PixiUtils';
import { OBSTACLE_SIZE } from './config';
import type { Vec2 } from './Vec';
export interface IObstacle {
  x: number;
  y: number;
  name: string;
  description: string;
  imagePath: string;
  bounds: Polygon;
  wall: boolean;
  walkable: boolean;
}
interface IObstacleSource {
  name: string;
  description: string;
  imagePath: string;
  // blocks line of sight
  wall: boolean;
  // blocks movement
  walkable: boolean;
}
export function create(coord: Vec2, obstacleSourceIndex: number) {
  const obstacle = obstacleSource[obstacleSourceIndex];
  if (obstacle) {

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
      ], inverted: false
    };

    const self: IObstacle = {
      x: coord.x,
      y: coord.y,
      name: obstacle.name,
      description: obstacle.description,
      imagePath: obstacle.imagePath,
      bounds,
      wall: obstacle.wall,
      walkable: obstacle.walkable
    };


    return self;
  } else {
    throw new Error(`No obstacle at index ${obstacleSourceIndex} of obstacleSource`)
  }
}
export function addImageForObstacle(obstacle: IObstacle) {
  // Obstacles go inside of containerUnits so that they can be z-index sorted
  // along with all the units so units can stand in front of or behind the walls
  Image.create(obstacle, obstacle.imagePath, containerUnits);

}

export const obstacleSource: IObstacleSource[] = [
  {
    name: 'Wall',
    description: 'This is a wall that will block your way.',
    imagePath: 'tiles/wall.png',
    wall: true,
    walkable: false
  },
  {
    name: 'Lava',
    description: 'Blocks movement, not sight.',
    imagePath: 'tiles/lava.png',
    wall: false,
    walkable: false
  },
];