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
  // Only can be picked up by players
  playerOnly: boolean;
  // effect is ONLY to be called within triggerPickup
  effect: ({ unit, player }: { unit?: IUnit; player?: Player.IPlayer }) => void;
}

export function create(
  x: number,
  y: number,
  singleUse: boolean,
  imagePath: string,
  playerOnly: boolean,
  effect: ({ unit, player }: { unit?: IUnit; player?: Player.IPlayer }) => void,
): IPickup {
  const self: IPickup = {
    x,
    y,
    imagePath,
    image: new Image(x, y, imagePath, containerPickup),
    singleUse,
    playerOnly,
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
      pickup.playerOnly,
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
  const player = window.game.players.find((p) => p.unit === unit);
  if (pickup.playerOnly && !player) {
    // If pickup is playerOnly, do not trigger if a player is not the one triggering it
    return;
  }
  pickup.effect({ unit, player });
  if (pickup.singleUse) {
    removePickup(pickup);
  }
}

// Special pickups are not stored in the pickups array because they shouldn't be
// randomly selected when adding pickups to a generated level.
export const specialPickups = {
  'images/portal.png': {
    imagePath: 'images/portal.png',
    playerOnly: true,
    effect: ({ unit, player }: { unit?: IUnit; player?: Player.IPlayer }) => {
      if (player) {
        Player.enterPortal(player);
      }
    },
  },
};
export const pickups = [
  {
    imagePath: 'images/pickups/card.png',
    effect: ({ unit, player }) => {
      if (player && player.clientId === window.clientId) {
        for (let i = 0; i < config.GIVE_NUM_CARDS_PER_LEVEL; i++) {
          const card = Card.generateCard();
          Card.addCardToHand(card, player);
        }
      }
    },
  },
];
