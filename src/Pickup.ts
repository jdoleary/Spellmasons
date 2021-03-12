import Image from './Image';
import type { IPlayer } from './Player';

export interface IPickup {
  x: number;
  y: number;
  image: Image;
  effect: (p: IPlayer) => void;
}

export function create(
  x: number,
  y: number,
  imagePath: string,
  effect: (p: IPlayer) => void,
): IPickup {
  const self: IPickup = {
    x,
    y,
    image: new Image(x, y, imagePath),
    effect,
  };

  // Start images small so when they spawn in they will grow
  self.image.transform.scale = 0.0;
  window.animationManager.setTransform(self.image.sprite, self.image.transform);
  self.image.scale(1.0);
  window.game.addPickupToArray(self);

  return self;
}
