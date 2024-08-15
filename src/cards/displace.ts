import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { getCurrentTargets, Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { HasSpace } from '../entity/Type';
import Underworld from '../Underworld';
import seedrandom from 'seedrandom';
import { getUniqueSeedString, prng } from '../jmath/rand';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as config from '../config';
import { teleport } from '../effects/teleport';

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
      const seed = seedrandom(`${getUniqueSeedString(underworld)}`);
      for (let i = 0; i < quantity; i++) {
        // Loop through all targets and batch swap locations
        const swaps: [HasSpace, Vec2][] = [];
        for (let targetObject of targets) {
          if (targetObject) {
            const displaceLocation = underworld.findValidSpawnInWorldBounds(prediction, seed, { allowLiquid: true });
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
