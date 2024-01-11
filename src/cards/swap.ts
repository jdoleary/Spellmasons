import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { getCurrentTargets, Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import * as config from '../config';
import * as Vec from '../jmath/Vec';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { HasSpace } from '../entity/Type';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { teleport } from '../effects/teleport';

export const swap_id = 'swap';
const spell: Spell = {
  card: {
    id: swap_id,
    category: CardCategory.Movement,
    sfx: 'swap',
    manaCost: 15,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 1,
    thumbnail: 'spellIconSwap.png',
    description: 'spell_swap',
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

      for (let targetObject of targets) {
        if (targetObject) {
          swaps.push([targetObject, swapLocations.shift() || swapLocation]);
        }
      }

      for (let [object, newLocation] of swaps) {
        teleport(object, newLocation, underworld, prediction);
      }
      return state;
    },
  },
};
export default spell;
