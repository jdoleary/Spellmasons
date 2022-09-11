import * as Unit from '../entity/Unit';
import floatingText from '../graphics/FloatingText';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';

const id = 'heal';
const healAmount = 3;

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    sfx: 'heal',
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'spellIconHeal.png',
    animationPath: 'spell-effects/potionPickup',
    description: `
Heals all targets ${healAmount} HP.
Will not heal beyond maximum health.
Stackable.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
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
        await Unit.addOneOffAnimation(unit, 'spell-effects/potionPickup', {}, { loop: false, animationSpeed: 0.3 });
      }
      return state;
    },
  },
};
export default spell;
