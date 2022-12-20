import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { getCurrentTargets, Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import * as config from '../config';
import * as Vec from '../jmath/Vec';
import * as Obstacle from '../entity/Obstacle';
import { CardCategory } from '../types/commonTypes';
import { skyBeam } from '../VisualEffects';
import { playDefaultSpellSFX } from './cardUtils';
import { HasSpace } from '../entity/Type';
import { CardRarity, probabilityMap } from '../types/commonTypes';

const id = 'swap';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    sfx: 'swap',
    manaCost: 15,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 1,
    thumbnail: 'spellIconSwap.png',
    description: `
Swaps the caster with the target.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      const { casterUnit } = state;
      playDefaultSpellSFX(card, prediction);
      // Loop through all targets and batch swap locations
      const swaps: [HasSpace, Vec2][] = [];
      const swapLocation = { x: casterUnit.x, y: casterUnit.y };
      const targets = getCurrentTargets(state);
      // Swap the casterUnit
      const casterSwapTarget = targets[0];
      if (casterSwapTarget) {
        swaps.push([casterUnit, casterSwapTarget]);
      }
      const swapLocations = [swapLocation, ...underworld.findValidSpawns(swapLocation, config.COLLISION_MESH_RADIUS / 4, 4)];

      for (let targetUnit of targets) {
        if (targetUnit) {
          swaps.push([targetUnit, swapLocations.shift() || swapLocation]);
        }
      }

      for (let [entity, newLocation] of swaps) {
        if (!prediction) {
          // Animate effect of unit spawning from the sky
          skyBeam(newLocation);
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
      return state;
    },
  },
};
export default spell;
