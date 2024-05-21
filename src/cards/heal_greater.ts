import * as Unit from '../entity/Unit';
import floatingText from '../graphics/FloatingText';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { healCardId } from './add_heal';
import { healSfx, healUnits } from '../effects/heal';

export const healGreaterId = 'Greater Heal';
const healAmount = 80;

const spell: Spell = {
  card: {
    id: healGreaterId,
    replaces: [healCardId],
    category: CardCategory.Blessings,
    //sfx: healSfx, // Heal FX Handled in Unit.takeDamage()
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconHeal2.png',
    animationPath: 'spell-effects/potionPickup',
    description: ['spell_heal', healAmount.toString()],
    timeoutMs: 1000,
    effect: async (state, card, quantity, underworld, prediction) => {
      await healUnits(state.targetedUnits, healAmount * quantity, state.casterUnit, underworld, prediction, state);
      return state;
    },
  },
};
export default spell;
