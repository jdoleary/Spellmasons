import * as Unit from '../entity/Unit';
import floatingText from '../graphics/FloatingText';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { healGreaterId } from './heal_greater';
import { healSfx, healUnits } from '../effects/heal';

export const heal_mass_id = 'Mass Heal';
const healAmount = 10;

const spell: Spell = {
  card: {
    id: heal_mass_id,
    // Mass heal doesn't require a target
    allowNonUnitTarget: true,
    requires: [healGreaterId],
    category: CardCategory.Blessings,
    //sfx: healSfx, // Heal FX Handled in Unit.takeDamage()
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    thumbnail: 'spellIconHeal3.png',
    animationPath: 'spell-effects/potionPickup',
    description: ['spell_heal_mass', healAmount.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      const units = (prediction ? underworld.unitsPrediction : underworld.units)
        .filter(u => u.alive && u.faction == state.casterUnit.faction);
      await healUnits(units, healAmount * quantity, state.casterUnit, underworld, prediction, state);
      return state;
    },
  },
};
export default spell;
