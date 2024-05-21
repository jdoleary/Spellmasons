import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { defaultPushDistance, forcePushToDestination, forcePushTowards } from '../effects/force_move';
import { dash_id } from './dash';

export const id = 'Fling';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    requires: [dash_id],
    supportQuantity: true,
    sfx: 'dash',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconFling.png',
    description: 'spell_fling',
    allowNonUnitTarget: true,
    ignoreRange: true,
    timeoutMs: 700,
    effect: async (state, card, quantity, underworld, prediction) => {
      playDefaultSpellSFX(card, prediction);
      await forcePushTowards(state.casterUnit, state.castLocation, defaultPushDistance * quantity, underworld, prediction);
      return state;
    },
  },
};
export default spell;
