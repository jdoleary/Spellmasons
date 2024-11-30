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
    probability: probabilityMap[CardRarity.UNCOMMON],
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
      // Swap the casterUnit with the last target
      const casterSwapTarget = targets[targets.length - 1];
      if (casterSwapTarget) {
        swaps.push([casterUnit, Vec.clone(casterSwapTarget)]);
      }
      const swapLocations = [swapLocation, ...underworld.findValidSpawns({ spawnSource: swapLocation, ringLimit: 4, prediction, radius: config.COLLISION_MESH_RADIUS / 4 })];

      for (let targetObject of targets) {
        if (targetObject) {
          swaps.push([targetObject, Vec.clone(swapLocations.shift() || swapLocation)]);
        }
      }

      // Swap pickups first.  This prevents pickups from being "picked up" when swapped with a unit
      // because unit setLocation triggers a check pickup collision but pickup setLocation does not
      // therefore if the pickups swap first, the pickup will not be where the unit arrives to
      // pick it up
      for (let [object, newLocation] of swaps) {
        if (Pickup.isPickup(object)) {
          teleport(object, newLocation, underworld, prediction, false, state.casterUnit);
        }
      }
      for (let [object, newLocation] of swaps) {
        if (Unit.isUnit(object)) {
          teleport(object, newLocation, underworld, prediction, false, state.casterUnit);
        }
      }
      if (!prediction && !globalThis.headless) {
        await new Promise(res => {
          setTimeout(res, 300);
        })
      }
      return state;
    },
  },
};
export default spell;
