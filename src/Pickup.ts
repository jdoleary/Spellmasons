import * as Image from './Image';
import * as CardUI from './CardUI';
import * as Cards from './cards';
import * as config from './config';
import * as Player from './Player';
import { containerPickup } from './PixiUtils';
import { IUnit, syncPlayerHealthManaUI } from './Unit';
import floatingText from './FloatingText';

export const PICKUP_RADIUS = 64;
export interface IPickup {
  x: number;
  y: number;
  name: string;
  description: string;
  imagePath: string;
  image: Image.IImage;
  // Only can be picked up once
  singleUse: boolean;
  // Only can be picked up by players
  playerOnly: boolean;
  // effect is ONLY to be called within triggerPickup
  effect: ({ unit, player }: { unit?: IUnit; player?: Player.IPlayer }) => void;
}
interface IPickupSource {
  name: string;
  description: string;
  imagePath: string;
  playerOnly?: boolean;
  effect: ({ unit, player }: { unit?: IUnit; player?: Player.IPlayer }) => void;
}

export function create(
  x: number,
  y: number,
  name: string,
  description: string,
  singleUse: boolean,
  imagePath: string,
  playerOnly: boolean,
  effect: ({ unit, player }: { unit?: IUnit; player?: Player.IPlayer }) => void,
): IPickup {
  const self: IPickup = {
    x,
    y,
    name,
    description,
    imagePath,
    image: Image.create(x, y, imagePath, containerPickup),
    singleUse,
    playerOnly,
    effect,
  };

  window.underworld.addPickupToArray(self);

  return self;
}
export function setPosition(pickup: IPickup, x: number, y: number) {
  pickup.x = x;
  pickup.y = y;
  Image.setPosition(pickup.image, x, y);
}
export type IPickupSerialized = Omit<IPickup, "image" | "effect"> & {
  image: Image.IImageSerialized
};
export function serialize(p: IPickup): IPickupSerialized {
  // effect is a callback and cannot be serialized
  const { effect, ...rest } = p;
  const serialized: IPickupSerialized = {
    ...rest,
    image: Image.serialize(p.image),
  };
  return serialized;
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
      pickup.name,
      pickup.description,
      pickup.singleUse,
      pickup.imagePath,
      pickup.playerOnly,
      foundPickup.effect,
    );
    return self;
  } else {
    throw new Error(`Could not load pickup with path ${pickup.imagePath}`);
  }
}
export function removePickup(pickup: IPickup) {
  Image.cleanup(pickup.image);
  window.underworld.removePickupFromArray(pickup);
}
export function triggerPickup(pickup: IPickup, unit: IUnit) {
  const player = window.underworld.players.find((p) => p.unit === unit);
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
export const specialPickups: { [image: string]: IPickupSource } = {
  'portal.png': {
    imagePath: 'portal.png',
    playerOnly: true,
    name: 'Portal',
    description:
      'Takes you to the next level when all players are either in the portal or dead.',
    effect: ({ unit, player }: { unit?: IUnit; player?: Player.IPlayer }) => {
      if (player) {
        Player.enterPortal(player);
      }
    },
  },
};
export const pickups: IPickupSource[] = [
  {
    imagePath: 'pickups/card',
    name: 'Cards',
    description: 'Grants the player a new spell',
    effect: ({ unit, player }) => {
      if (player) {
        const numCardsToGive = 1;
        for (let i = 0; i < numCardsToGive; i++) {
          const cardsToChooseFrom = Object.values(Cards.allCards).filter(card => !player.cards.includes(card.id));
          const card = CardUI.generateCard(cardsToChooseFrom);
          if (card) {
            CardUI.addCardToHand(card, player);
          } else {
            floatingText({
              coords: {
                x: config.MAP_WIDTH / 2,
                y: config.MAP_HEIGHT / 2,
              },
              text: `You have all of the cards already!`
            });
          }
        }
      }
    },
  },
  {
    imagePath: 'pickups/mana-potion',
    name: 'Mana Potion',
    description: 'Grants the player more mana',
    effect: ({ unit, player }) => {
      if (player) {
        player.unit.mana += 40;
        // Sync UI immediately when mana changes
        syncPlayerHealthManaUI();
      }
    },
  },
];
