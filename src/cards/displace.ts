import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { getCurrentTargets, Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { HasSpace } from '../entity/Type';
import Underworld from '../Underworld';
import seedrandom from 'seedrandom';
import { prng } from '../jmath/rand';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as config from '../config';
import { teleport } from '../effects/teleport';

export function findRandomDisplaceLocation(underworld: Underworld, radius: number, seed: prng, prediction: boolean): Vec2 | undefined {
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
    isValid = underworld.isPointValidSpawn(randomCoord, radius, prediction);
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
    description: 'spell_displace',
    effect: async (state, card, quantity, underworld, prediction) => {
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);

      // Seed is set before targets are looped so that each target goes to a different location but
      // also so that it is consistent and seeded for a given cast
      const seed = seedrandom(`${underworld.turn_number}-${state.casterUnit.id}`);
      for (let i = 0; i < quantity; i++) {
        // Loop through all targets and batch swap locations
        const swaps: [HasSpace, Vec2][] = [];
        for (let targetObject of targets) {
          if (targetObject) {
            const displaceLocation = findRandomDisplaceLocation(underworld, config.COLLISION_MESH_RADIUS, seed, prediction);
            swaps.push([targetObject, displaceLocation || targetObject]);
          }
        }

        for (let [object, newLocation] of swaps) {
          teleport(object, newLocation, underworld, prediction, true);
        }
      }
      return state;
    },
  },
};
export default spell;
