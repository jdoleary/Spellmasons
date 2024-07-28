import { Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';

const id = 'Cursify';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    supportQuantity: false,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    // Forbidden because it is SO powerful when used on
    // minibosses and with it's synergies
    probability: probabilityMap[CardRarity.FORBIDDEN],
    thumbnail: 'spellIconCursify.png',
    description: ['Designates target\'s blessings as curses.  Does not change the functionality of the blessings.'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
        if (unit.modifiers) {
          Object.values(unit.modifiers).filter(m => !m.isCurse).forEach(modifier => {
            modifier.isCurse = true;
          })
        }
      }
      return state;
    },
  },
};
export default spell;
