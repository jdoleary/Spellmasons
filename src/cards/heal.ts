import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { healSfx, healUnits } from '../effects/heal';

export const healCardId = 'heal';
const healAmount = 30;

const spell: Spell = {
  card: {
    id: healCardId,
    category: CardCategory.Blessings,
    //sfx: healSfx, // Heal FX Handled in Unit.takeDamage()
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconHeal.png',
    animationPath: 'potionPickup',
    description: ['spell_heal', healAmount.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      await healUnits(state.targetedUnits, healAmount * quantity, state.casterUnit, underworld, prediction, state);
      return state;
    },
  },
};
export default spell;
