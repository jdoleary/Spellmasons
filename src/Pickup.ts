import Image from './Image';
import * as Card from './Card';
import * as Player from './Player';
import * as config from './config';
import { containerPickup } from './PixiUtils';
import type { IUnit } from './Unit';
export interface IPickup {
  x: number;
  y: number;
  imagePath: string;
  image: Image;
  // Only can be picked up once
  singleUse: boolean;
  // effect is ONLY to be called within triggerPickup
  effect: (u: IUnit) => void;
}

export function create(
  x: number,
  y: number,
  singleUse: boolean,
  imagePath: string,
  effect: (unit: IUnit) => void,
): IPickup {
  const self: IPickup = {
    x,
    y,
    imagePath,
    image: new Image(x, y, imagePath, containerPickup),
    singleUse,
    effect,
  };

  // Start images small so when they spawn in they will grow
  self.image.transform.scale = 0.0;
  window.animationManager.setTransform(self.image.sprite, self.image.transform);
  self.image.scale(1.0);
  window.game.addPickupToArray(self);

  return self;
}
// Reinitialize a pickup from another pickup object, this is used in loading game state after reconnect
export function load(pickup: IPickup) {
  // Get the pickup object
  let foundPickup = pickups.find((p) => p.imagePath == pickup.imagePath);
  // If it does not exist, perhaps it is a special pickup such as a portal
  if (!foundPickup) {
    foundPickup = specialPickups[pickup.imagePath];
  }
  if (foundPickup) {
    const self = create(
      pickup.x,
      pickup.y,
      pickup.singleUse,
      pickup.imagePath,
      foundPickup.effect,
    );
    return self;
  } else {
    console.error('Could not load pickup with path', pickup.imagePath);
  }
}
export function removePickup(pickup: IPickup) {
  pickup.image.cleanup();
  window.game.removePickupFromArray(pickup);
}
export function triggerPickup(pickup: IPickup, unit: IUnit) {
  pickup.effect(unit);
  if (pickup.singleUse) {
    removePickup(pickup);
  }
}

// Special pickups are not stored in the pickups array because they shouldn't be
// randomly selected when adding pickups to a generated level.
export const specialPickups: {
  [imagePath: string]: {
    imagePath: string;
    effect: (u: IUnit) => void;
  };
} = {
  'images/portal.png': {
    imagePath: 'images/portal.png',
    effect: (u: IUnit) => {
      const player = window.game.players.find((p) => p.unit === u);
      if (player) {
        Player.enterPortal(player);
      }
    },
  },
};
export const pickups = [
  {
    imagePath: 'images/pickups/card.png',
    effect: (u: IUnit) => {
      const player = window.game.players.find((p) => p.unit === u);
      if (player && player.clientId === window.clientId) {
        for (let i = 0; i < config.GIVE_NUM_CARDS_PER_LEVEL; i++) {
          const card = Card.generateCard();
          Card.addCardToHand(card, player);
        }
      }
    },
  },
];
