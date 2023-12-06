import * as Unit from '../entity/Unit';
import floatingText from '../graphics/FloatingText';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export const id = 'send_mana';
const amount = 20;

const spell: Spell = {
  card: {
    id: id,
    category: CardCategory.Blessings,
    sfx: 'heal', // TODO - Different sfx?
    supportQuantity: true,
    manaCost: amount,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconPurify.png', //TODO - Mana Icon
    animationPath: 'spell-effects/potionPickup',
    description: ['spell_send_mana', amount.toString()], //TODO - Mana descr
    effect: async (state, card, quantity, underworld, prediction) => {
      // Since all targets are animated simultaneously we only need to await
      // the latest one, no need to use Promise.all
      let animationPromise = Promise.resolve();
      // .filter: only target living units
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
        const manaToRestore = amount * quantity;
        if (!prediction && quantity > 1) {
          for (let unit of state.targetedUnits) {
            floatingText({
              coords: unit,
              text: `+${Math.abs(manaToRestore)} Mana`
            });
          }
        }
        playDefaultSpellSFX(card, prediction);
        unit.mana += manaToRestore;
        animationPromise = Image.addOneOffAnimation(unit, 'spell-effects/potionPickup', {}, { loop: false, animationSpeed: 0.3 }); //TODO - Different animation?
      }
      await animationPromise;
      return state;
    },
  },
};
export default spell;
