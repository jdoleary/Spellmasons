import Image from './Image';
import type { IPlayer } from './Player';
import * as Card from './cards';
import * as config from './config';
import { containerPickup } from './PixiUtils';
export interface IPickup {
  x: number;
  y: number;
  image: Image;
  // Only can be picked up once
  singleUse: boolean;
  // effect is ONLY to be called within triggerPickup
  effect: (p: IPlayer) => void;
}

export function create(
  x: number,
  y: number,
  singleUse: boolean,
  imagePath: string,
  effect: (p: IPlayer) => void,
): IPickup {
  const self: IPickup = {
    x,
    y,
    singleUse,
    image: new Image(x, y, imagePath, containerPickup),
    effect,
  };

  // Start images small so when they spawn in they will grow
  self.image.transform.scale = 0.0;
  window.animationManager.setTransform(self.image.sprite, self.image.transform);
  self.image.scale(1.0);
  window.game.addPickupToArray(self);

  return self;
}
export function removePickup(pickup: IPickup) {
  pickup.image.cleanup();
  window.game.removePickupFromArray(pickup);
}
export function triggerPickup(pickup: IPickup, player: IPlayer) {
  pickup.effect(player);
  if (pickup.singleUse) {
    removePickup(pickup);
  }
}

export const pickups = [
  {
    img: 'images/pickups/card.png',
    effect: (p: IPlayer) => {
      if (p.clientId === window.clientId) {
        for (let i = 0; i < config.GIVE_NUM_CARDS_PER_LEVEL; i++) {
          const card = Card.generateCard();
          Card.addCardToHand(card);
        }
      }
    },
  },
];
