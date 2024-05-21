import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { pushId } from './push';
import { defaultPushDistance, forcePushAwayFrom } from '../effects/force_move';

export const id = 'repel';
const spell: Spell = {
  card: {
    id,
    requires: [pushId],
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'push',
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconRepel.png',
    description: 'spell_repel',
    timeoutMs: 700,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        promises.push(forcePushAwayFrom(entity, state.castLocation, defaultPushDistance * quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};

export default spell;
