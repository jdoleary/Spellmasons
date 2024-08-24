import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { defaultPushDistance, forcePushAwayFrom } from '../effects/force_move';

export const pushId = 'push';
const spell: Spell = {
  card: {
    id: pushId,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'push',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconPush.png',
    description: 'spell_push',
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        promises.push(forcePushAwayFrom(entity, state.casterUnit, defaultPushDistance * quantity, underworld, prediction, state.casterUnit));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
