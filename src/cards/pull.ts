import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { defaultPushDistance, forcePushTowards } from '../effects/force_move';

export const pullId = 'pull';
const spell: Spell = {
  card: {
    id: pullId,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'pull',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconPull.png',
    description: 'spell_pull',
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        promises.push(forcePushTowards(entity, state.casterUnit, defaultPushDistance * quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
