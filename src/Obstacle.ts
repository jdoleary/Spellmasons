import * as Image from './Image';
import { containerPickup } from './PixiUtils';
export interface IObstacle {
  // note: x,y are cell positions, not board positions
  x: number;
  y: number;
  imagePath: string;
  image: Image.IImage;
}
export function create(x: number, y: number, imagePath: string) {
  const self: IObstacle = {
    x,
    y,
    imagePath,
    image: Image.create(x, y, imagePath, containerPickup),
  };
  self.image.sprite.scale.set(0.0);
  Image.scale(self.image, 1.0);
  window.game.addObstacleToArray(self);
  return self;
}
// Reinitialize an obstacle from another obstacle object, this is used in loading game state after reconnect
export function load(o: IObstacle) {
  return create(o.x, o.y, o.imagePath);
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
