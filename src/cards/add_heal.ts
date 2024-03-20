import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { healUnits } from '../effects/heal';

export const healCardId = 'heal';
const healAmount = 30;

const spell: Spell = {
  card: {
    id: healCardId,
    category: CardCategory.Blessings,
    sfx: 'heal',
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconHeal.png',
    animationPath: 'spell-effects/potionPickup',
    description: ['spell_heal', healAmount.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      await healUnits(state.targetedUnits, healAmount * quantity, state.casterUnit, underworld, prediction, state);
      return state;
    },
  },
};
export default spell;
