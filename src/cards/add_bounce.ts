import { Spell, refundLastSpell } from './index';
import { CardCategory, UnitSubType } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { arrowCardId } from './arrow';

export const addBounceId = 'Add Bounce';
const spell: Spell = {
  card: {
    id: addBounceId,
    category: CardCategory.Targeting,
    probability: probabilityMap[CardRarity.UNCOMMON],
    requires: [arrowCardId],
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    supportQuantity: true,
    ignoreRange: true,
    allowNonUnitTarget: true,
    noInitialTarget: true,
    requiresFollowingCard: true,
    thumbnail: 'spellIconRicochet.png',
    description: 'spell_add_bounce',
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      state.aggregator.additionalBounce += quantity;
      return state;
    },
  },
};
export default spell;
