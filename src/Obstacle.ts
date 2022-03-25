import * as Image from './Image';
import type { Polygon } from './Polygon';
import { containerBoard } from './PixiUtils';
export interface IObstacle {
  x: number;
  y: number;
  name: string;
  description: string;
  imagePath: string;
  image: Image.IImage;
  bounds: Polygon;
}
interface IObstacleSource {
  name: string;
  description: string;
  imagePath: string;
}
export function create(x: number, y: number, obstacle: IObstacleSource) {
  const image = Image.create(x, y, obstacle.imagePath, containerBoard);
  const width = image.sprite.width;
  const height = image.sprite.height;
  const _x = x - width / 2;
  const _y = y - height / 2;
  const bounds = {
    points: [
      { x: _x, y: _y },
      { x: _x, y: _y + height },
      { x: _x + width, y: _y + height },
      { x: _x + width, y: _y },
    ], inverted: false
  };

  if (bounds === undefined) {
    console.error("Cannot create Obstacle, points do not make up a valid polygon");
    return
  }

  const self: IObstacle = {
    x,
    y,
    name: obstacle.name,
    description: obstacle.description,
    imagePath: obstacle.imagePath,
    image,
    bounds,
  };


  window.underworld.addObstacleToArray(self);
  return self;
}
// Reinitialize an obstacle from another obstacle object, this is used in loading game state after reconnect
export function load(o: IObstacle) {
  return create(o.x, o.y, o);
}
export function remove(o: IObstacle) {
  Image.cleanup(o.image);
  window.underworld.removeObstacleFromArray(o);
}
export type IObstacleSerialized = Omit<IObstacle, "image"> & { image: Image.IImageSerialized };
export function serialize(o: IObstacle): IObstacleSerialized {
  return {
    ...o,
    image: Image.serialize(o.image),
  };
}

export const obstacleSource: IObstacleSource[] = [
  {
    name: 'Wall',
    description: 'This is a wall that will block your way.',
    imagePath: 'tiles/wall.png',
  },
];

export const obstacleSectors = [
  // Empty
  [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ],
  // Corner
  [
    [0, 0, 0],
    [0, 0, 0],
    [1, 0, 0]
  ],
  [
    [1, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ],
  [
    [0, 0, 1],
    [0, 0, 0],
    [0, 0, 0]
  ],
  [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 1]
  ],
  // Outer Corner
  [
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1]
  ],
  // Center
  [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0]
  ],
  // Double
  [
    [1, 0, 1],
    [0, 0, 0],
    [0, 0, 0]
  ],
  [
    [1, 0, 0],
    [0, 0, 0],
    [1, 0, 0]
  ],
  [
    [0, 0, 1],
    [0, 0, 0],
    [0, 0, 1]
  ],
  [
    [0, 0, 0],
    [0, 0, 0],
    [1, 0, 1]
  ],
  // Column
  [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0]
  ],
  [
    [0, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  // Quad
  [
    [1, 0, 1],
    [0, 0, 0],
    [1, 0, 1]
  ],
  // Cross
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ],
  // Diag
  [
    [1, 0, 0],
    [0, 0, 0],
    [0, 0, 1]
  ],
  [
    [0, 0, 1],
    [0, 0, 0],
    [1, 0, 0]
  ],
  // Passage
  [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1]
  ],
  [
    [1, 1, 1],
    [0, 0, 0],
    [1, 1, 1]
  ],
  // Empty
  // [
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0]
  // ],
];