import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { pullId } from './pull';
import { forcePushToDestination } from '../effects/force_move';

export const id = 'vortex';
const spell: Spell = {
  card: {
    id,
    requires: [pullId],
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'pull',
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconVortex.png',
    description: 'spell_vortex',
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        promises.push(forcePushToDestination(entity, state.castLocation, quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
