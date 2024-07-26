import { Spell, refundLastSpell } from './index';
import { CardCategory, UnitSubType } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { arrowCardId } from './arrow';

export const addPierceId = 'Add Pierce';
const spell: Spell = {
  card: {
    id: addPierceId,
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
    thumbnail: 'spellIconPierce.png',
    description: 'spell_add_pierce',
    frontload: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      state.aggregator.additionalPierce += quantity;
      return state;
    },
  },
};
export default spell;
