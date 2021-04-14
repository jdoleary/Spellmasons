import * as Image from './Image';
import { containerBoard } from './PixiUtils';
export interface IObstacle {
  // note: x,y are cell positions, not board positions
  x: number;
  y: number;
  name: string;
  description: string;
  imagePath: string;
  image: Image.IImage;
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
  };
  self.image.sprite.scale.set(0.0);
  Image.scale(self.image, 1.0);
  window.game.addObstacleToArray(self);
  return self;
}
// Reinitialize an obstacle from another obstacle object, this is used in loading game state after reconnect
export function load(o: IObstacle) {
  return create(o.x, o.y, o);
}
export function remove(o: IObstacle) {
  Image.cleanup(o.image);
  window.game.removeObstacleFromArray(o);
}
export function serialize(o: IObstacle) {
  return {
    ...o,
    image: Image.serialize(o.image),
  };
}

export const obstacleSource: IObstacleSource[] = [{
          name: 'Lava',
          description: 'This is lava',
          imagePath: 'images/tiles/lava.png',

}];
