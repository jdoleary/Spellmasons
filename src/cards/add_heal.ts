import * as Unit from '../entity/Unit';
import floatingText from '../graphics/FloatingText';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { healUnits } from '../effects/heal';
import { test_startCheckPromises, spyPromise, test_endCheckPromises } from '../promiseSpy';

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
      if (!prediction) {
        spyPromise();

        test_startCheckPromises('heal');
        await healUnits(state.targetedUnits, healAmount * quantity, underworld, prediction, state);
        test_endCheckPromises();
      }
      return state;
    },
  },
};
export default spell;
