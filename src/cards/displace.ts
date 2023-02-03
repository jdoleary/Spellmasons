import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import * as Obstacle from '../entity/Obstacle';
import { CardCategory } from '../types/commonTypes';
import { skyBeam } from '../VisualEffects';
import { HasSpace } from '../entity/Type';
import Underworld from '../Underworld';
import seedrandom from 'seedrandom';
import * as colors from '../graphics/ui/colors';
import { prng } from '../jmath/rand';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export function findRandomDisplaceLocation(underworld: Underworld, radius: number, seed: prng): Vec2 | undefined {
  let isValid = false;
  let randomCoord;
  const infiniteLoopLimit = 100;
  let i = 0;
  do {
    i++;
    if (i >= infiniteLoopLimit) {
      console.warn('Could not find random displace location');
      return undefined;
    }
    randomCoord = underworld.getRandomCoordsWithinBounds(underworld.limits, seed);
    isValid = underworld.isPointValidSpawn(randomCoord, radius);
  } while (!isValid);
  return randomCoord

}
const id = 'displace';
const sfx = 'swap';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx,
    manaCost: 15,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 1,
    thumbnail: 'spellIconDisplace.png',
    description: 'spell_displace',
    showPrediction: ({ targetedUnits, targetedPickups, quantity, aggregator, extra }, outOfRange?: boolean) => {
      const predictionShowTarget = (target: HasSpace, newLocation: Vec2) => {
        // Show prediction lines before the move actually occurs
        if (globalThis.predictionGraphics) {
          globalThis.predictionGraphics.lineStyle(4, colors.forceMoveColor, 1.0);
          globalThis.predictionGraphics.moveTo(target.x, target.y);
          globalThis.predictionGraphics.lineTo(newLocation.x, newLocation.y);
          // Draw circle at the end so the line path isn't a trail of rectangles with sharp edges
          globalThis.predictionGraphics.lineStyle(1, colors.forceMoveColor, 1.0);
          globalThis.predictionGraphics.beginFill(colors.forceMoveColor);
          globalThis.predictionGraphics.drawCircle(newLocation.x, newLocation.y, 3);
          globalThis.predictionGraphics.endFill();
        }
      }
      if (extra?.swapUnits) {
        for (let target of targetedUnits) {
          const newLocation = extra.swapUnits[target.id];
          predictionShowTarget(target, newLocation)
        }
      } else {
        console.error('Displace showPrediction() is missing extra.swapUnits')
      }
      if (extra?.swapPickups) {
        for (let target of targetedPickups) {
          const newLocation = extra.swapPickups[target.id];
          predictionShowTarget(target, newLocation)
        }
      } else {
        console.error('Displace showPrediction() is missing extra.swapPickups')
      }

    },
    animate: async ({ targetedUnits, targetedPickups, casterUnit, quantity, aggregator, extra }, triggerEffectStage, underworld) => {
      playSFXKey(sfx);
      if (extra?.swapUnits) {
        for (let target of targetedUnits) {
          const newLocation = extra.swapUnits[target.id];
          // Animate effect of unit spawning from the sky
          skyBeam(newLocation);
        }
      } else {
        console.error('Displace animate() is missing extra.swapUnits')
      }
      if (extra?.swapPickups) {
        for (let target of targetedPickups) {
          const newLocation = extra.swapPickups[target.id];
          // Animate effect of unit spawning from the sky
          skyBeam(newLocation);
        }
      } else {
        console.error('Displace animate() is missing extra.swapPickups')
      }

    },
    cacheSpellInvokation: (args, underworld, prediction) => {
      // Seed is set before targets are looped so that each target goes to a different location but
      // also so that it is consistent and seeded for a given cast
      const seed = seedrandom(`${underworld.seed}-${underworld.turn_number}-${args.casterUnit.id}`);
      const swapUnits: { [unitId: number]: Vec2 } = {};
      const swapPickups: { [pickupId: number]: Vec2 } = {};
      for (let i = 0; i < args.quantity; i++) {
        // Loop through all targets and batch swap locations
        for (let { targets, swapArray } of [{ targets: args.targetedUnits, swapArray: swapUnits }, { targets: args.targetedPickups, swapArray: swapPickups }]) {
          for (let target of targets) {
            if (target) {
              const displaceLocation = findRandomDisplaceLocation(underworld, target.radius, seed);
              swapArray[target.id] = displaceLocation || target;
            }
          }
        }
      }
      return {
        extra: {
          swapUnits,
          swapPickups
        }
      };
    },
    effect2: (calculated, underworld, prediction) => {
      const { extra } = calculated;
      if (extra?.swaps) {
        for (let [entity, newLocation] of extra.swaps) {
          if (Unit.isUnit(entity)) {
            // Physically swap
            Unit.setLocation(entity, newLocation);
            // Check to see if unit interacts with liquid
            Obstacle.tryFallInOutOfLiquid(entity, underworld, prediction);
          } else if (Pickup.isPickup(entity)) {
            Pickup.setPosition(entity, newLocation.x, newLocation.y);
          } else {
            entity.x = newLocation.x;
            entity.y = newLocation.y;
          }
        }
      } else {
        console.error('Displace animate() is missing extra.swaps')
      }

    },
  },
};
export default spell;
