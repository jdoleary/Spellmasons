import type * as PIXI from 'pixi.js';
import * as Image from '../graphics/Image';
import * as Player from './Player';
import { addPixiSprite, addPixiSpriteAnimated, containerUnits, pixiText, startBloodParticleSplatter } from '../graphics/PixiUtils';
import { syncPlayerHealthManaUI, IUnit, takeDamage, playAnimation, runPickupEvents, drawCharges } from './Unit';
import { checkIfNeedToClearTooltip } from '../graphics/PlanningView';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import * as config from '../config';
import { clone, Vec2 } from '../jmath/Vec';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { manaBlue, manaDarkBlue, stamina } from '../graphics/ui/colors';
import Underworld from '../Underworld';
import { hasBloodCurse } from '../cards/blood_curse';
import { HasSpace } from './Type';
import { explain, EXPLAIN_INVENTORY, EXPLAIN_OVERFILL, tutorialCompleteTask, updateTutorialChecklist } from '../graphics/Explain';
import * as CardUI from '../graphics/ui/CardUI';
import { bossmasonUnitId } from './units/deathmason';
import { chooseOneOfSeeded, getUniqueSeedString } from '../jmath/rand';
import { skyBeam } from '../VisualEffects';
import { BLUE_PORTAL_JID, makeCursedEmitter, makeDeathmasonPortal, RED_PORTAL_JID, stopAndDestroyForeverEmitter } from '../graphics/ParticleCollection';
import { Localizable } from '../localization';
import seedrandom from 'seedrandom';
import { JEmitter } from '../types/commonTypes';
import { raceTimeout } from '../Promise';
import { createVisualLobbingProjectile } from './Projectile';
import floatingText from '../graphics/FloatingText';
import { containerParticles } from '../graphics/Particles';
import { elEndTurnBtn } from '../HTMLElements';
import { healManaUnit, healUnit } from '../effects/heal';
import { teleport } from '../effects/teleport';

export const PICKUP_RADIUS = config.SELECTABLE_RADIUS;
export const PICKUP_IMAGE_PATH = 'scroll';
export const RED_PORTAL = 'Red Portal';
export const BLUE_PORTAL = 'Blue Portal';
export const HEALTH_POTION = 'Health Potion';
export const MANA_POTION = 'Mana Potion';
export const STAMINA_POTION = 'Stamina Potion';
export const RECALL_POINT = 'Recall';
const RED_PORTAL_DAMAGE = 30;
type IPickupDescription = (pickup: IPickup, underworld: Underworld) => Localizable;
type IPickupEffect = ({ unit, player, pickup, prediction }: { unit?: IUnit; player?: Player.IPlayer, pickup: IPickup, underworld: Underworld, prediction: boolean }) => void;
type IPickupInit = ({ pickup, underworld }: { pickup: IPickup, underworld: Underworld }) => void;
type IPickupWillTrigger = ({ unit, player, pickup }: { unit?: IUnit; player?: Player.IPlayer, pickup: IPickup, underworld: Underworld }) => boolean;
export function isPickup(maybePickup: any): maybePickup is IPickup {
  return maybePickup && maybePickup.type == 'pickup';
}
export type IPickup = HasSpace & {
  type: 'pickup';
  id: number;
  name: string;
  imagePath?: string;
  image?: Image.IImageAnimated;
  // if this IPickup is a prediction copy, real is a reference to the real pickup that it is a copy of
  real?: IPickup;
  // if this IPickup is a real pickup, predictionCopy is a reference to the latest prediction copy.
  // used for diffing the effects of a spell to sync multiplayer
  predictionCopy?: IPickup;
  // Only can be picked up by players
  playerOnly: boolean;
  // Pickups optionally have a "time limit" and will disappear after this many turns
  turnsLeftToGrab?: number;
  text?: PIXI.Text;
  // Boosts the effect of the pickup, default 1
  power: number;
  // effect is ONLY to be called within triggerPickup
  // returns true if the pickup did in fact trigger - this is useful
  // for preventing one use health potions from triggering if the unit
  // already has max health
  description: IPickupDescription;
  effect: IPickupEffect;
  // Determines if the pickup will trigger for a given unit
  willTrigger: IPickupWillTrigger;
  emitter?: JEmitter;
  // Identifier for serailized emitter
  emitterJID?: string;
  flaggedForRemoval: boolean;
  // A rarely used property that prevents multiple
  // SENT_FORCE_TRIGGER messages from being sent
  // on the same pickup.
  sentForceTrigger?: boolean;

}
export interface IPickupSource {
  name: string;
  // If a pickup belongs to a mod, it's modName will be automatically assigned
  // This is used to dictate wether or not the modded pickup is used
  modName?: string;
  imagePath?: string;
  animationSpeed?: number;
  playerOnly?: boolean;
  turnsLeftToGrab?: number;
  scale: number;
  probability: number;
  init?: IPickupInit;
  description: IPickupDescription;
  effect: IPickupEffect;
  willTrigger: IPickupWillTrigger;
}
export function copyForPredictionPickup(p: IPickup): IPickup {
  // Remove image and text since prediction pickups won't be rendered
  const { image, text, ...rest } = p;
  if (p.id > lastPredictionPickupId) {
    lastPredictionPickupId = p.id;
  }
  const predictionPickup = Object.assign(p.predictionCopy || {}, {
    real: p,
    ...rest
  });
  p.predictionCopy = predictionPickup;
  return predictionPickup;
}
export const TIME_CIRCLE_JID = 'timeCircle';

// This does not need to be unique to underworld, it just needs to be unique
let lastPredictionPickupId = 0;
// Creates a pickup directly (as opposed to via a network message)
// Sometimes clients need to call this directly, like if they got
// pickup info from a sync from the host or loading a pickup
// or for a prediction pickup
export function create({ pos, pickupSource, idOverride, logSource }:
  {
    pos: Vec2, pickupSource: IPickupSource, idOverride?: number, logSource?: string,
  }, underworld: Underworld, prediction: boolean): IPickup {
  const { name, description, imagePath, effect, willTrigger, scale, animationSpeed, playerOnly = false, turnsLeftToGrab } = pickupSource;
  const { x, y } = pos
  if (isNaN(x) || isNaN(y)) {
    console.error('Unexpected: Created pickup at NaN', pickupSource.name);
  }
  const id = exists(idOverride)
    ? idOverride
    : prediction
      ? ++lastPredictionPickupId
      : ++underworld.lastPickupId;

  if (!prediction && id > underworld.lastPickupId) {
    underworld.lastPickupId = id;
  }
  const duplicatePickup = (prediction ? underworld.pickupsPrediction : underworld.pickups).find(p => p.id == id)
  if (duplicatePickup) {
    if (prediction) {
      console.log('Pickup ids', underworld.pickupsPrediction.map(p => p.id), id, 'incrementor:', lastPredictionPickupId, 'prediction:', prediction);
    } else {
      console.log('Pickup ids', underworld.pickups.map(p => p.id), id, 'incrementor:', underworld.lastPickupId, 'prediction:', prediction);
    }
    console.error('Aborting: creating a pickup with duplicate id.');
    console.error(`Aborting: creating a pickup with duplicate id. source: ${logSource} idOverride: ${!!idOverride} prediction: ${prediction}`);
    if (duplicatePickup.name != name) {
      console.error('Duplicate pickup is over a different name', duplicatePickup.name, name);
    }
    return duplicatePickup;
  }
  const self: IPickup = {
    id,
    type: 'pickup',
    x,
    y,
    radius: PICKUP_RADIUS,
    name,
    immovable: true,
    inLiquid: false,
    imagePath,
    // Pickups are stored in containerUnits so that they
    // will be automatically z-indexed
    image: (!imagePath || !containerUnits || prediction) ? undefined : Image.create({ x, y }, imagePath, containerUnits, { animationSpeed, loop: true }),
    playerOnly,
    power: 1,
    description,
    effect,
    willTrigger,
    flaggedForRemoval: false,
    beingPushed: false
  };
  if (self.image) {
    self.image.sprite.scale.x = scale;
    self.image.sprite.scale.y = scale;
  }
  if (name == RED_PORTAL) {
    // Right now red portal and cursed mana potion are the only pickup that uses an emitter;
    // however if that changes in the future this should be refactored so
    // that there isn't a special case inside of Pickup.create
    assignEmitter(self, RED_PORTAL_JID, prediction, underworld);
  } else if (name == BLUE_PORTAL) {
    // Right now red portal and cursed mana potion are the only pickup that uses an emitter;
    // however if that changes in the future this should be refactored so
    // that there isn't a special case inside of Pickup.create
    assignEmitter(self, BLUE_PORTAL_JID, prediction, underworld);
  } else if (name == PORTAL_YELLOW_NAME) {
    assignEmitter(self, PORTAL_YELLOW_NAME, prediction, underworld);
  }


  if (turnsLeftToGrab) {
    self.turnsLeftToGrab = turnsLeftToGrab;

    // Only add timeCircle and text if the pickup has an image (meaning it is rendered)
    // Prediction pickups are not rendered and don't need these.
    if (self.image) {
      const timeCircle = addPixiSprite('time-circle.png', self.image.sprite);
      if (timeCircle) {
        // @ts-ignore jid is a custom identifier to id the text element used for the player name
        timeCircle.jid = TIME_CIRCLE_JID;
        timeCircle.anchor.x = 0;
        timeCircle.anchor.y = 0;
      }

      addText(self);
    }
  }
  if (pickupSource.init) {
    pickupSource.init({ pickup: self, underworld });
  }

  underworld.addPickupToArray(self, prediction);
  // Check for collisions when a new pickup is created
  for (let unit of underworld.units) {
    underworld.checkPickupCollisions(unit, false);
  }
  return self;
}
function assignEmitter(pickup: IPickup, emitterId: string, prediction: boolean, underworld: Underworld) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  // If there's a previous emitter, remove it because it is about to be replaced
  if (pickup.emitter) {
    stopAndDestroyForeverEmitter(pickup.emitter);
  }
  if (emitterId == RED_PORTAL_JID) {
    pickup.emitter = makeDeathmasonPortal(pickup, prediction, '#520606', '#e03636');
    if (pickup.image) {
      if (pickup.emitter) {
        Image.cleanup(pickup.image);
      } else {
        // Use tinted portal image as backup in case emitters are limited
        // @ts-ignore: Special property to keep the tint of portals
        pickup.image.sprite.keepTint = 0xe43636;
        // @ts-ignore: Special property to keep the tint of portals
        pickup.image.sprite.tint = pickup.image.sprite.keepTint;
      }
    }
  } else if (emitterId == BLUE_PORTAL_JID) {
    pickup.emitter = makeDeathmasonPortal(pickup, prediction, '#1a276e', '#5252fa');
    if (pickup.image) {
      if (pickup.emitter) {
        Image.cleanup(pickup.image);
      } else {
        // Use tinted portal image as backup in case emitters are limited
        // @ts-ignore: Special property to keep the tint of portals
        pickup.image.sprite.keepTint = 0x5252fa;
        // @ts-ignore: Special property to keep the tint of portals
        pickup.image.sprite.tint = pickup.image.sprite.keepTint;
      }
    }
  } else if (emitterId == PORTAL_YELLOW_NAME) {
    pickup.emitter = makeDeathmasonPortal(pickup, prediction, '#6e6b1a', '#f0fa52');
    if (pickup.image) {
      if (pickup.emitter) {
        Image.cleanup(pickup.image);
      } else {
        // Use tinted portal image as backup in case emitters are limited
        // @ts-ignore: Special property to keep the tint of portals
        pickup.image.sprite.keepTint = 0x5252fa;
        // @ts-ignore: Special property to keep the tint of portals
        pickup.image.sprite.tint = pickup.image.sprite.keepTint;
      }
    }
  } else {
    console.error('Attempting to assignEmitter with unkown id:', emitterId);
  }
  if (pickup.emitter) {
    // Pickup emitters should not be cleaned up until they are intentionally destroyed
    pickup.emitter.cleanAfterTurn = false;
    if (containerParticles) {
      underworld.particleFollowers.push({
        displayObject: containerParticles,
        emitter: pickup.emitter,
        target: pickup
      });
    }
  }
  // @ts-ignore: jid custom property for serialization
  pickup.emitterJID = emitterId;
}
function addText(pickup: IPickup) {
  if (pickup.real) {
    // Pickup is a prediction copy and is not rendered.  This is known because it has a reference to
    // the real instance.
    return;
  }
  // Value of text is set in sync()
  pickup.text = pixiText('', { fill: 'white', align: 'center', ...config.PIXI_TEXT_DROP_SHADOW });
  sync(pickup);
  if (pickup.text) {
    pickup.text.anchor.x = 0;
    pickup.text.anchor.y = 0;
    // Center the text in the timeCircle
    pickup.text.x = 13;
    pickup.text.y = 5;
    if (pickup.image) {
      pickup.image.sprite.addChild(pickup.text);
    } else {
      console.error('Cannot add text to pickup, image is missing')
    }
  }

}

export function sync(pickup: IPickup) {
  if (pickup.image) {
    pickup.image.sprite.x = pickup.x;
    pickup.image.sprite.y = pickup.y;
  }
  if (exists(pickup.turnsLeftToGrab) && pickup.text) {
    pickup.text.text = `${pickup.turnsLeftToGrab}`;
  }
}
export function setPosition(pickup: IPickup, x: number, y: number) {
  pickup.x = x;
  pickup.y = y;
  Image.setPosition(pickup.image, { x, y });
}
export type IPickupSerialized = Omit<IPickup, "image" | "effect" | "text" | "real" | "emitter" | "description" | "willTrigger"> & {
  image?: Image.IImageAnimatedSerialized,
  emitter?: string
};
export function serialize(p: IPickup): IPickupSerialized {
  // effect is a callback and cannot be serialized
  // real and predictionCopy are references and cannot be serialized
  // because it would be cyclical
  const { effect, text, real, emitter, predictionCopy, description, willTrigger, ...rest } = p;
  const serialized: IPickupSerialized = {
    ...rest,
    image: p.image ? Image.serialize(p.image) : undefined,
    // @ts-ignore: jid custom property for serialization
    emitter: emitter?.jid
  };
  return serialized;
}
// Reinitialize a pickup from another pickup object, this is used in loading game state after reconnect
export function load(pickup: IPickupSerialized, underworld: Underworld, prediction: boolean): IPickup | undefined {
  // Get the pickup object
  let foundPickup = pickups.find((p) => p.name == pickup.name);
  if (foundPickup) {
    // Note, emitter but be desctructured here or else it will clobber
    // newPickups emitter during Object.assign without removing it
    const { image, flaggedForRemoval, emitter, ...toCopy } = pickup;
    if (flaggedForRemoval) {
      // Do not create a pickup that has been removed
      console.error('Attempted to Load a pickup that is flaggedForRemoval');
      return undefined;
    }
    const newPickup = create({ pos: pickup, pickupSource: foundPickup, idOverride: pickup.id }, underworld, prediction);
    if (!prediction && newPickup.id > underworld.lastPickupId) {
      underworld.lastPickupId = newPickup.id;
    }
    // Note: It is important here to use Object.assign so that the pickup reference is the SAME ref as is created in the
    // create function because the create function passes that ref to the underworld pickups array.
    // So when you mutate the properties, the ref must stay the same.
    Object.assign(newPickup, toCopy);
    // Restore scale which is set when power is set
    setPower(newPickup, newPickup.power);
    if (!prediction) {
      addText(newPickup);
    }
    if (newPickup.emitter && newPickup.emitterJID) {
      assignEmitter(newPickup, newPickup.emitterJID, prediction, underworld);
    }
    return newPickup;
  } else {
    console.error('Could not load pickup with path', pickup.imagePath);
    return undefined;
  }
}
export function removePickup(pickup: IPickup, underworld: Underworld, prediction: boolean) {
  if (prediction) {
    if (pickup.predictionCopy) {
      pickup.predictionCopy.flaggedForRemoval = true;
    }
  } else {
    pickup.flaggedForRemoval = true;
    Image.cleanup(pickup.image);
    stopAndDestroyForeverEmitter(pickup.emitter);
    checkIfNeedToClearTooltip();
  }
  // Remove any associated forcePushs
  const fms = (prediction ? underworld.forceMovePrediction : underworld.forceMove).filter(fm => fm.pushedObject == pickup)
  if (fms.length) {
    // set the associated forceMove to velocity of 0 so it will be removed at the next invocation of runForceMove
    fms.forEach(fm => { fm.velocity = { x: 0, y: 0 } });
  }
}
export function triggerPickup(pickup: IPickup, unit: IUnit, player: Player.IPlayer | undefined, underworld: Underworld, prediction: boolean) {
  const willTrigger = !pickup.flaggedForRemoval && unit.alive && pickup.willTrigger({ unit, player, pickup, underworld });
  if (willTrigger) {
    runPickupEvents(unit, pickup, underworld, prediction);
    pickup.effect({ unit, player, pickup, underworld, prediction });
    removePickup(pickup, underworld, prediction);
    // Now that the players attributes may have changed, sync UI
    if (globalThis.player && player == globalThis.player) {
      underworld.syncPlayerPredictionUnitOnly();
      syncPlayerHealthManaUI(underworld);
    }
  }
  underworld.progressGameState();
}
export function tryTriggerPickup(pickup: IPickup, unit: IUnit, underworld: Underworld, prediction: boolean) {
  if (pickup.flaggedForRemoval) {
    // Don't trigger pickup if flagged for removal
    return;
  }
  if (!unit.alive) {
    // Only living units can trigger pickups
    return;
  }
  const player = underworld.players.find((p) => p.unit === unit);
  if (pickup.playerOnly && !player) {
    // If pickup is playerOnly, do not trigger if a player is not the one triggering it
    return;
  }
  if (player && !player.isSpawned) {
    // Don't trigger pickups for players that haven't spawned yet
    // (and are looking for a spawn my moving their "ghost self" around)
    return;
  }
  if (prediction) {
    triggerPickup(pickup, unit, player, underworld, prediction);
  } else {
    // All pickups triggering must be networked to prevent desyncs resulting 
    // from slight position differences that can result in cascading desyncs due to
    // a pickup triggering on one client or host but not on others.
    // Server (or singleplayer as host) initiates all pickups
    if (globalThis.isHost(underworld.pie)) {
      // Try a prediction effect to see if it will trigger and
      // only send QUEUE_PICKUP_TRIGGER if it will trigger
      const willTrigger = pickup.willTrigger({ unit, player, pickup, underworld });
      if (willTrigger) {
        triggerPickup(pickup, unit, player, underworld, prediction);
        // send QUEUE_PICKUP_TRIGGER network message to make sure the same pickup gets triggered
        // on any other client that may have missed this collision
        underworld.pie.sendData({
          type: MESSAGE_TYPES.QUEUE_PICKUP_TRIGGER,
          pickupId: pickup.id,
          pickupName: pickup.name,
          unitId: unit.id,
          playerClientId: player?.clientId
        });
      }
    } else {
      // Trigger if in queue
      const pickupInQueue = underworld.aquirePickupQueue.find(x => x.pickupId == pickup.id && x.unitId == unit.id);
      if (pickupInQueue) {
        pickupInQueue.flaggedForRemoval = true;
        triggerPickup(pickup, unit, player, underworld, prediction);
      } else {
        const willTrigger = !pickup.flaggedForRemoval && unit.alive && pickup.willTrigger({ unit, player, pickup, underworld });
        // Do not send FORCE_TRIGGER_PICKUP if the pickup won't trigger, for example, health potions
        // don't trigger if you are full health
        if (willTrigger) {
          // Unit has touched pickup before headless has, so force trigger it
          // This happens when unit is walking as opposed to being pushed
          if (!pickup.sentForceTrigger) {
            console.log(`Unit touched pickup before headless has: ${pickup.name}, ${unit.id}, ${player?.name}`)
            // Only send a FORCE_TRIGGER_PICKUP message if the unit is the client's own player unit or a non player unit
            if (player && globalThis.player == player) {
              underworld.pie.sendData({
                type: MESSAGE_TYPES.FORCE_TRIGGER_PICKUP,
                pickupId: pickup.id,
                pickupName: pickup.name,
                unitId: unit.id,
                collidedPlayerId: player?.playerId
              });
            }
          }
        }

      }
    }
  }
}

export const manaPotionRestoreAmount = 40;
const healthPotionRestoreAmount = 50;
export const spike_damage = 30;
export const PICKUP_SPIKES_NAME = 'Trap';
export const PORTAL_PURPLE_NAME = 'Portal';
export const PORTAL_YELLOW_NAME = 'Yellow Portal';
export const pickups: IPickupSource[] = [
  {
    imagePath: 'trap',
    animationSpeed: -config.DEFAULT_ANIMATION_SPEED,
    playerOnly: false,
    name: PICKUP_SPIKES_NAME,
    probability: 40,
    scale: 1,
    description: (pickup) => ['Deals 🍞 damage to any unit that touches it', (spike_damage * pickup.power).toString()],
    willTrigger: ({ unit, player, pickup, underworld }) => {
      return !!unit;
    },
    effect: ({ unit, player, pickup, prediction, underworld }) => {
      if (unit) {
        // Play trap spring animation
        if (!prediction) {
          const animationSprite = addPixiSpriteAnimated('trapAttack', containerUnits, {
            loop: false,
            animationSpeed: 0.2,
            onComplete: () => {
              if (animationSprite?.parent) {
                animationSprite.parent.removeChild(animationSprite);
              }
            }
          });
          if (animationSprite) {

            animationSprite.anchor.set(0.5);
            animationSprite.x = pickup.x;
            animationSprite.y = pickup.y;
          }
          const animationSprite2 = addPixiSpriteAnimated('trapAttackMagic', containerUnits, {
            loop: false,
            animationSpeed: 0.2,
            onComplete: () => {
              if (animationSprite2?.parent) {
                animationSprite2.parent.removeChild(animationSprite2);
              }
            }
          });
          if (animationSprite2) {
            animationSprite2.anchor.set(0.5);
            animationSprite2.x = pickup.x;
            animationSprite2.y = pickup.y;
          }

        }
        takeDamage({
          unit: unit,
          amount: spike_damage * pickup.power,
          fromVec2: unit,
        }, underworld, prediction);
      }
    }
  },
  {
    imagePath: 'portal',
    animationSpeed: -0.5,
    playerOnly: true,
    name: RED_PORTAL,
    probability: 0,
    scale: 1,
    description: (pickup) => ['red portal description', bossmasonUnitId, (RED_PORTAL_DAMAGE * pickup.power).toString()],
    willTrigger: ({ unit, player, pickup, underworld }) => {
      return !!player;
    },
    effect: ({ unit, player, pickup, underworld, prediction }) => {
      const otherRedPortals = underworld.pickups.filter(p => !p.flaggedForRemoval && p.name == RED_PORTAL && p !== pickup)
      const seed = seedrandom(getUniqueSeedString(underworld, player));
      const randomOtherRedPortal = chooseOneOfSeeded(otherRedPortals, seed);
      if (player) {
        // Remove the pickups before teleporting the unit so they don't trigger
        // the 2nd portal
        removePickup(pickup, underworld, false);
        if (randomOtherRedPortal) {
          removePickup(randomOtherRedPortal, underworld, false);
          // Ensure the teleport point is valid
          // Note: pickup MUST be removed before checking if the point is valid because
          // isPointValidSpawn returns false if it's spawning a unit on a point taken up by a pickup
          // (that isn't flagged for removal)
          if (underworld.isPointValidSpawn(randomOtherRedPortal, prediction)) {
            teleport(player.unit, randomOtherRedPortal, underworld, prediction);
            playSFXKey('swap');
            skyBeam(pickup);
            skyBeam(randomOtherRedPortal);
          } else {
          }
        }
        takeDamage({
          unit: player.unit,
          amount: RED_PORTAL_DAMAGE * pickup.power,
        }, underworld, false);
      }
    },
  },
  {
    imagePath: 'portal',
    animationSpeed: -0.5,
    playerOnly: true,
    name: BLUE_PORTAL,
    probability: 0,
    scale: 1,
    description: (pickup) => ['blue portal description', (RED_PORTAL_DAMAGE * pickup.power).toString()],
    willTrigger: ({ unit, player, pickup, underworld }) => {
      return !!player;
    },
    effect: ({ unit, player, pickup, underworld, prediction }) => {
      const otherBluePortals = underworld.pickups.filter(p => !p.flaggedForRemoval && p.name == BLUE_PORTAL && p !== pickup)
      const seed = seedrandom(getUniqueSeedString(underworld, player));
      const randomOtherBluePortal = chooseOneOfSeeded(otherBluePortals, seed);
      if (player) {
        // Remove the pickups before teleporting the unit so they don't trigger
        // the 2nd portal
        removePickup(pickup, underworld, false);
        if (randomOtherBluePortal) {
          removePickup(randomOtherBluePortal, underworld, false);
          // Ensure the teleport point is valid
          // Note: pickup MUST be removed before checking if the point is valid because
          // isPointValidSpawn returns false if it's spawning a unit on a point taken up by a pickup
          // (that isn't flagged for removal)
          if (underworld.isPointValidSpawn(randomOtherBluePortal, prediction)) {
            teleport(player.unit, randomOtherBluePortal, underworld, prediction);
            skyBeam(pickup);
            skyBeam(randomOtherBluePortal);
          }
        }
        takeDamage({
          unit: player.unit,
          amount: -RED_PORTAL_DAMAGE * pickup.power,
        }, underworld, false);
      }
    },
  },
  {
    imagePath: 'portal',
    animationSpeed: -0.5,
    playerOnly: true,
    name: PORTAL_PURPLE_NAME,
    probability: 0,
    scale: 1,
    description: (pickup, underworld) => 'explain portal',
    willTrigger: ({ unit, player, pickup, underworld }) => {
      return !!player;
    },
    effect: ({ unit, player, underworld }) => {
      // Only send the ENTER_PORTAL message from
      // the client of the player that entered the portal
      if (player && player == globalThis.player) {
        playSFXKey('purplePortal');
        underworld.pie.sendData({
          type: MESSAGE_TYPES.ENTER_PORTAL
        });
        CardUI.clearSelectedCards(underworld);
      }
      // Move the player unit so they don't continue to trigger the pickup more than once
      if (player && player.unit) {
        player.unit.resolveDoneMoving(true);
        player.unit.x = NaN;
        player.unit.y = NaN;
      }
    },
  },
  {
    imagePath: 'portal',
    animationSpeed: -0.5,
    playerOnly: true,
    name: PORTAL_YELLOW_NAME,
    probability: 10,
    scale: 1,
    description: (pickup, underworld) => 'yellow_portal_desc',
    willTrigger: ({ unit, player, pickup, underworld }) => {
      return !!player;
    },
    effect: ({ unit, player, underworld }) => {
      // Only send the ENTER_PORTAL message from
      // the client of the player that entered the portal
      if (player && player == globalThis.player) {
        playSFXKey('purplePortal');
        underworld.pie.sendData({
          type: MESSAGE_TYPES.ENTER_PORTAL
        });
        CardUI.clearSelectedCards(underworld);
      }
      // Move the player unit so they don't continue to trigger the pickup more than once
      if (player && player.unit) {
        player.unit.resolveDoneMoving(true);
        player.unit.x = NaN;
        player.unit.y = NaN;
      }
    },
  },
  {
    imagePath: 'staminaPotion',
    animationSpeed: 0.2,
    name: STAMINA_POTION,
    description: (pickup) => ['Restores stamina to 🍞', (100 * pickup.power).toString().concat("%")],
    probability: 40,
    scale: 1.0,
    playerOnly: true,
    willTrigger: ({ unit, player, pickup, underworld }) => {
      return !!player;
    },
    effect: ({ unit, pickup, player, underworld, prediction }) => {
      if (unit) {
        unit.stamina += unit.staminaMax * pickup.power;
        if (!prediction) {
          playSFXKey('potionPickupMana');
        }
        // Animate
        Image.addOneOffAnimation(unit, 'potionPickup', {}, {
          loop: false,
          animationSpeed: 0.3,
          colorReplace: { colors: [[0xff0000, stamina]], epsilon: 0.15 },
        });
      }
    },
  },
  {
    imagePath: 'manaPotion',
    animationSpeed: 0.2,
    name: MANA_POTION,
    description: (pickup) => [`mana potion description`, (manaPotionRestoreAmount * pickup.power).toString()],
    probability: 80,
    scale: 1.0,
    playerOnly: true,
    willTrigger: ({ unit, player, pickup, underworld }) => {
      return !!player;
    },
    effect: ({ unit, pickup, player, underworld, prediction }) => {
      if (unit) {
        healManaUnit(unit, manaPotionRestoreAmount * pickup.power, undefined, underworld, prediction);
      }
    },
  },
  {
    imagePath: 'healthPotion',
    animationSpeed: 0.2,
    name: HEALTH_POTION,
    probability: 80,
    scale: 1.0,
    playerOnly: true,
    description: pickup => ['health potion description', (healthPotionRestoreAmount * pickup.power).toString()],
    willTrigger: ({ unit, player, pickup, underworld }) => {
      // Only trigger the health potion if the player will be affected by the health potion
      // Normally that's when they have less than full health, but there's an exception where
      // players that have blood curse will be damaged by healing so it should trigger for them too
      return !!(player && (player.unit.health < player.unit.healthMax || hasBloodCurse(player.unit)));
    },
    effect: ({ unit, player, pickup, underworld, prediction }) => {
      if (unit) {
        if (!prediction) {
          playSFXKey('potionPickupHealth');
        }
        healUnit(unit, healthPotionRestoreAmount * pickup.power, undefined, underworld, prediction);
      }
    },
  },
  {
    imagePath: 'recall',
    animationSpeed: 0,
    playerOnly: true,
    name: RECALL_POINT,
    probability: 0,
    scale: 1,
    description: pickup => [''],
    willTrigger: ({ unit, player, pickup, underworld }) => {
      return false;
    },
    effect: ({ unit, player, pickup, underworld }) => {
      // the recall point does not have a collision effect
    },
  },
];
export function setPower(pickup: IPickup, newPower: number) {
  if (pickup.image) {
    const newScale = getScaleFromPower(newPower);

    pickup.image.sprite.scale.x = newScale;
    pickup.image.sprite.scale.y = newScale;
  }
  pickup.power = newPower;
}
function getScaleFromPower(power: number): number {
  // this final scale of the pickup will always be less than the max multiplier
  const maxMultiplier = 4;
  // adjust power to ensure scale = 1 at power = 1
  power -= 1;
  // calculate scale multiplier with diminishing formula
  // 20 is an arbitrary number that controls the speed at which the scale approaches the max
  return 1 + (maxMultiplier - 1) * (power / (power + 20))
}
export function givePlayerUpgrade(p: Player.IPlayer, underworld: Underworld) {
  // Only give an upgrade if there is an upgrade available to choose
  if (p && underworld.upgradesLeftToChoose(p)) {
    elEndTurnBtn?.classList.toggle('upgrade', true);
    skyBeam(p.unit);
    if (p && p == globalThis.player) {
      if (p.inventory.length > config.NUMBER_OF_TOOLBAR_SLOTS - 1) {
        explain(EXPLAIN_INVENTORY);
      }
    }
  }
}