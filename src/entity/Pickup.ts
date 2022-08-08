import type * as PIXI from 'pixi.js';
import * as Image from '../graphics/Image';
import type * as Player from './Player';
import { addPixiSprite, addPixiSpriteAnimated, containerUnits, pixiText } from '../graphics/PixiUtils';
import { IUnit, takeDamage } from './Unit';
import { checkIfNeedToClearTooltip } from '../graphics/PlanningView';
import { explainManaOverfill } from '../graphics/Jprompt';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import * as config from '../config';
import { Vec2 } from '../jmath/Vec';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { manaBlue } from '../graphics/ui/colors';
import Underworld from '../Underworld';

export const PICKUP_RADIUS = config.SELECTABLE_RADIUS;
export interface IPickup {
  x: number;
  y: number;
  radius: number;
  name: string;
  description: string;
  imagePath: string;
  image?: Image.IImageAnimated;
  // Only can be picked up once
  singleUse: boolean;
  // Only can be picked up by players
  playerOnly: boolean;
  // Pickups optionally have a "time limit" and will disappear after this many turns
  turnsLeftToGrab?: number;
  // Defines custom behavior when turnsLeftToGrab reaches 0
  onTurnsLeftDone?: (self: IPickup) => Promise<void>;
  text?: PIXI.Text;
  // effect is ONLY to be called within triggerPickup
  // returns true if the pickup did in fact trigger - this is useful
  // for preventing one use health potions from triggering if the unit
  // already has max health
  effect: ({ unit, player, prediction }: { unit?: IUnit; player?: Player.IPlayer, underworld: Underworld, prediction: boolean }) => boolean | undefined;
}
export function isPickup(maybePickup: any): maybePickup is IPickup {
  // Take a select few of the pickup only properties and ensure that the object has them
  // and then tell TS that it is a pickup.  This WILL fail if another non pickup object 
  // is given these properties.
  return maybePickup.singleUse !== undefined && maybePickup.playerOnly !== undefined;
}
interface IPickupSource {
  name: string;
  description: string;
  imagePath: string;
  animationSpeed?: number;
  singleUse: boolean;
  playerOnly?: boolean;
  turnsLeftToGrab?: number;
  scale: number;
  probability: number;
  effect: ({ unit, player, prediction }: { unit?: IUnit; player?: Player.IPlayer, underworld: Underworld, prediction: boolean }) => boolean | undefined;
}
export function copyForPredictionPickup(p: IPickup): IPickup {
  // Remove image and text since prediction pickups won't be rendered
  const { image, text, ...rest } = p;
  return {
    ...rest
  }
}

export function create({ pos, pickupSource, onTurnsLeftDone }:
  {
    pos: Vec2, pickupSource: IPickupSource, onTurnsLeftDone?: (self: IPickup) => Promise<void>
  }, underworld: Underworld, prediction: boolean) {
  const { name, description, imagePath, effect, scale, singleUse, animationSpeed, playerOnly = false, turnsLeftToGrab } = pickupSource;
  const { x, y } = pos
  const self: IPickup = {
    x,
    y,
    radius: PICKUP_RADIUS,
    name,
    description,
    imagePath,
    // Pickups are stored in containerUnits so that they
    // will be automatically z-indexed
    image: (!containerUnits || prediction) ? undefined : Image.create({ x, y }, imagePath, containerUnits, { animationSpeed, loop: true }),
    singleUse,
    playerOnly,
    effect,
    onTurnsLeftDone
  };
  if (self.image) {
    self.image.sprite.scale.x = scale;
    self.image.sprite.scale.y = scale;
  }
  if (turnsLeftToGrab) {
    self.turnsLeftToGrab = turnsLeftToGrab;

    // Only add timeCircle and text if the pickup has an image (meaning it is rendered)
    // Prediction pickups are not rendered and don't need these.
    if (self.image) {

      const timeCircle = addPixiSprite('time-circle.png', self.image.sprite);
      if (timeCircle) {
        timeCircle.anchor.x = 0;
        timeCircle.anchor.y = 0;
      }

      self.text = pixiText(`${turnsLeftToGrab}`, { fill: 'white', align: 'center' });
      if (self.text) {
        self.text.anchor.x = 0;
        self.text.anchor.y = 0;
        // Center the text in the timeCircle
        self.text.x = 13;
        self.text.y = 5;
        self.image.sprite.addChild(self.text);
      }
    }
  }

  underworld.addPickupToArray(self, prediction);

  return self;
}

export function syncImage(pickup: IPickup) {
  if (pickup.image) {
    pickup.image.sprite.x = pickup.x;
    pickup.image.sprite.y = pickup.y;
  }
}
export function setPosition(pickup: IPickup, x: number, y: number) {
  pickup.x = x;
  pickup.y = y;
  Image.setPosition(pickup.image, { x, y });
}
export type IPickupSerialized = Omit<IPickup, "image" | "effect"> & {
  image?: Image.IImageAnimatedSerialized
};
export function serialize(p: IPickup): IPickupSerialized {
  // effect is a callback and cannot be serialized
  const { effect, ...rest } = p;
  const serialized: IPickupSerialized = {
    ...rest,
    image: p.image ? Image.serialize(p.image) : undefined,
  };
  return serialized;
}
// Reinitialize a pickup from another pickup object, this is used in loading game state after reconnect
export function load(pickup: IPickup, underworld: Underworld, prediction: boolean) {
  // Get the pickup object
  let foundPickup = pickups.find((p) => p.imagePath == pickup.imagePath);
  if (foundPickup) {
    // TODO verify that complex pickup behavior like onTurnsLeftDone still work after load, traps
    // probably don't work after load because callbacks can't be serialized
    const { image, ...toCopy } = pickup;
    const newPickup = create({ pos: pickup, pickupSource: foundPickup }, underworld, prediction);
    // Note: It is important here to use Object.assign so that the pickup reference is the SAME ref as is created in the
    // create function because the create function passes that ref to the underworld pickups array.
    // So when you mutate the properties, the ref must stay the same.
    Object.assign(newPickup, toCopy);
    return newPickup;
  } else {
    throw new Error(`Could not load pickup with path ${pickup.imagePath}`);
  }
}
export function removePickup(pickup: IPickup, underworld: Underworld, prediction: boolean) {
  Image.cleanup(pickup.image);
  underworld.removePickupFromArray(pickup, prediction);
  checkIfNeedToClearTooltip();
}
export function triggerPickup(pickup: IPickup, unit: IUnit, underworld: Underworld, prediction: boolean) {
  const player = underworld.players.find((p) => p.unit === unit);
  if (pickup.playerOnly && !player) {
    // If pickup is playerOnly, do not trigger if a player is not the one triggering it
    return;
  }
  const didTrigger = pickup.effect({ unit, player, underworld, prediction });
  // Only remove pickup if it triggered AND is a singleUse pickup
  if (pickup.singleUse && didTrigger) {
    removePickup(pickup, underworld, prediction);
  }
}

const manaPotionRestoreAmount = 40;
const healthPotionRestoreAmount = 5;
const spike_damage = 3;
export const CARDS_PICKUP_NAME = 'Spells';
export const pickups: IPickupSource[] = [
  {
    imagePath: 'pickups/spikes',
    animationSpeed: -0.5,
    playerOnly: false,
    singleUse: true,
    name: 'Spike Pit',
    probability: 70,
    scale: 1,
    description: `Deals ${spike_damage} to any unit (including NPCs) that touches it`,
    effect: ({ unit, player, prediction, underworld }) => {
      if (unit) {
        takeDamage(unit, spike_damage, unit, underworld, prediction)
        return true;
      }
      return false;
    }
  },
  {
    imagePath: 'portal',
    animationSpeed: -0.5,
    playerOnly: true,
    singleUse: false,
    name: 'Portal',
    probability: 0,
    scale: 1,
    description:
      'Takes you to the next level when all players are either in the portal or dead.',
    effect: ({ unit, player, underworld }) => {
      // Only send the ENTER_PORTAL message from
      // the client of the player that entered the portal
      if (player && player == globalThis.player) {
        underworld.pie.sendData({
          type: MESSAGE_TYPES.ENTER_PORTAL
        });
      }
      // Move the player unit so they don't continue to trigger the pickup more than once
      if (player && player.unit) {
        player.unit.resolveDoneMoving();
        player.unit.x = NaN;
        player.unit.y = NaN;
      }
      return true;
    },
  },
  {
    imagePath: 'pickups/scroll',
    name: CARDS_PICKUP_NAME,
    description: 'Grants the player a new spell',
    probability: 0,
    singleUse: true,
    scale: 0.5,
    turnsLeftToGrab: 4,
    playerOnly: true,
    effect: ({ unit, player, underworld }) => {
      underworld.showUpgrades(false);
      return true;
    },
  },
  {
    imagePath: 'pickups/manaPotion',
    animationSpeed: 0.2,
    name: 'Mana Potion',
    description: `Restores ${manaPotionRestoreAmount} mana.  May overfill mana.`,
    probability: 80,
    singleUse: true,
    scale: 1.0,
    playerOnly: true,
    effect: ({ unit, player, underworld }) => {
      if (player) {
        player.unit.mana += manaPotionRestoreAmount;
        explainManaOverfill();
        // Animate
        if (player.unit.image) {
          const animationSprite = addPixiSpriteAnimated('spell-effects/potionPickup', player.unit.image.sprite, {
            loop: false,
            onComplete: () => {
              if (animationSprite && animationSprite.parent) {
                animationSprite.parent.removeChild(animationSprite);
              }
            }
          });
          if (animationSprite) {
            if (!animationSprite.filters) {
              animationSprite.filters = [];
            }
            // Change the health color to blue
            animationSprite.filters.push(
              // @ts-ignore for some reason ts is flagging this as an error but it works fine
              // in pixi.
              new MultiColorReplaceFilter(
                [
                  [0xff0000, manaBlue],
                ],
                0.1
              )
            );
          }
        }

        // Now that the player unit's mana has increased,sync the new
        // mana state with the player's predictionUnit so it is properly
        // refelcted in the mana bar
        // (note: this would be auto corrected on the next mouse move anyway)
        underworld.syncPlayerPredictionUnitOnly();
        return true;
      }
      return false;
    },
  },
  {
    imagePath: 'pickups/healthPotion',
    animationSpeed: 0.2,
    name: 'Health Potion',
    probability: 80,
    scale: 1.0,
    playerOnly: true,
    singleUse: true,
    description: `Restores ${healthPotionRestoreAmount} health.`,
    effect: ({ player, underworld }) => {
      if (player && player.unit.health < player.unit.healthMax) {
        takeDamage(player.unit, -healthPotionRestoreAmount, undefined, underworld, false);
        // Add spell effect animation
        if (player.unit.image) {
          const animationSprite = addPixiSpriteAnimated('spell-effects/potionPickup', player.unit.image.sprite, {
            loop: false,
            onComplete: () => {
              if (animationSprite && animationSprite.parent) {
                animationSprite.parent.removeChild(animationSprite);
              }
            }
          });
        }

        // Cap health at max
        player.unit.health = Math.min(player.unit.health, player.unit.healthMax);
        // Now that the player unit's mana has increased,sync the new
        // mana state with the player's predictionUnit so it is properly
        // refelcted in the health bar
        // (note: this would be auto corrected on the next mouse move anyway)
        underworld.syncPlayerPredictionUnitOnly();
        return true;
      }
      return false;
    },
  },
];