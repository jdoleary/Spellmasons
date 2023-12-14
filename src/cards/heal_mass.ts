import * as Unit from '../entity/Unit';
import floatingText from '../graphics/FloatingText';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { heal_greater_id } from './heal_greater';

export const heal_mass_id = 'Mass Heal';
const healAmount = 10;

const spell: Spell = {
  card: {
    id: heal_mass_id,
    // Mass heal doesn't require a target
    allowNonUnitTarget: true,
    requires: [heal_greater_id],
    category: CardCategory.Blessings,
    sfx: 'heal',
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    thumbnail: 'spellIconHeal3.png',
    animationPath: 'spell-effects/potionPickup',
    description: ['spell_heal_mass', healAmount.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // Since all targets are animated simultaneously we only need to await
      // the latest one, no need to use Promise.all
      let animationPromise = Promise.resolve();
      // .filter: only target living units
      for (let unit of (prediction ? underworld.unitsPrediction : underworld.units).filter(u => u.alive && u.faction == state.casterUnit.faction)) {
        const damage = -healAmount * quantity;
        if (!prediction && quantity > 1) {
          for (let unit of state.targetedUnits) {
            floatingText({
              coords: unit,
              text: `+${Math.abs(damage)} Health`
            });
          }
        }
        playDefaultSpellSFX(card, prediction);
        Unit.takeDamage(unit, damage, undefined, underworld, prediction, state);
        animationPromise = Image.addOneOffAnimation(unit, 'spell-effects/potionPickup', {}, { loop: false, animationSpeed: 0.3 });
      }
      await animationPromise;
      return state;
    },
  },
};
export default spell;
