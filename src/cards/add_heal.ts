import * as Unit from '../entity/Unit';
import floatingText from '../graphics/FloatingText';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';

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
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconHeal.png',
    animationPath: 'spell-effects/potionPickup',
    description: `
Heals all targets ${healAmount} HP.
Will not heal beyond maximum health.
Stackable.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // Since all targets are animated simultaneously we only need to await
      // the latest one, no need to use Promise.all
      let animationPromise = Promise.resolve();
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
        animationPromise = Image.addOneOffAnimation(unit, 'spell-effects/potionPickup', {}, { loop: false, animationSpeed: 0.3 });
      }
      await animationPromise;
      return state;
    },
  },
};
export default spell;
