import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { healSfx, healUnits } from '../effects/heal';
import { GetSpellDamage } from '../entity/Unit';

export const healCardId = 'heal';
const healMult = 1.5;

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
    animationPath: 'spell-effects/potionPickup',
    description: ['spell_heal', GetSpellDamage(undefined, healMult).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      await healUnits(state.targetedUnits, GetSpellDamage(state.casterUnit.damage, healMult) * quantity, state.casterUnit, underworld, prediction, state);
      return state;
    },
  },
};
export default spell;
