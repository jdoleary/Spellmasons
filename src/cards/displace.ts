import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { getCurrentTargets, Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import * as Obstacle from '../entity/Obstacle';
import { CardCategory } from '../types/commonTypes';
import { skyBeam } from '../VisualEffects';
import { playDefaultSpellSFX } from './cardUtils';
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
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'swap',
    manaCost: 15,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 1,
    thumbnail: 'spellIconDisplace.png',
    description: `
Teleport the target to a random location.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);

      // Seed is set before targets are looped so that each target goes to a different location but
      // also so that it is consistent and seeded for a given cast
      const seed = seedrandom(`${underworld.turn_number}-${state.casterUnit.id}`);
      for (let i = 0; i < quantity; i++) {
        // Loop through all targets and batch swap locations
        const swaps: [HasSpace, Vec2][] = [];
        for (let targetUnit of targets) {
          if (targetUnit) {
            const displaceLocation = findRandomDisplaceLocation(underworld, targetUnit.radius, seed);
            swaps.push([targetUnit, displaceLocation || targetUnit]);
          }
        }

        for (let [entity, newLocation] of swaps) {
          if (!prediction) {
            // Animate effect of unit spawning from the sky
            skyBeam(newLocation);
          }

          // Show prediction lines before the move actually occurs
          if (prediction && globalThis.predictionGraphics) {
            globalThis.predictionGraphics.lineStyle(4, colors.forceMoveColor, 1.0);
            globalThis.predictionGraphics.moveTo(entity.x, entity.y);
            globalThis.predictionGraphics.lineTo(newLocation.x, newLocation.y);
            // Draw circle at the end so the line path isn't a trail of rectangles with sharp edges
            globalThis.predictionGraphics.lineStyle(1, colors.forceMoveColor, 1.0);
            globalThis.predictionGraphics.beginFill(colors.forceMoveColor);
            globalThis.predictionGraphics.drawCircle(newLocation.x, newLocation.y, 3);
            globalThis.predictionGraphics.endFill();
          }
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
      }
      return state;
    },
  },
};
export default spell;
