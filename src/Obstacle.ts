import type { LineSegment } from './collision/collisionMath';
import * as Image from './Image';
import { containerBoard } from './PixiUtils';
export interface IObstacle {
  x: number;
  y: number;
  name: string;
  description: string;
  imagePath: string;
  image: Image.IImage;
  walls: LineSegment[];
}
interface IObstacleSource {
  name: string;
  description: string;
  imagePath: string;
}
export function create(x: number, y: number, obstacle: IObstacleSource) {
  const self: IObstacle = {
    x,
    y,
    name: obstacle.name,
    description: obstacle.description,
    imagePath: obstacle.imagePath,
    image: Image.create(x, y, obstacle.imagePath, containerBoard),
    walls: []
  };
  const width = self.image.sprite.width;
  const height = self.image.sprite.height;
  const _x = x - width / 2;
  const _y = y - height / 2;
  // add walls for collision
  self.walls.push({ p1: { x: _x, y: _y }, p2: { x: _x + width, y: _y } });
  self.walls.push({ p1: { x: _x, y: _y }, p2: { x: _x, y: _y + height } });
  self.walls.push({ p1: { x: _x + width, y: _y + height }, p2: { x: _x + width, y: _y } });
  self.walls.push({ p1: { x: _x + width, y: _y + height }, p2: { x: _x, y: _y + height } });

  self.image.sprite.scale.set(0.0);
  Image.scale(self.image, 1.0);
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
