import { Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';

const WAIT_TIME = 500;
const id = 'Dev Record Delay';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    sfx: '',
    manaCost: 15,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 1,
    thumbnail: 'unknown.png',
    description: `
    Waits a certain amount of time.  This is useful when recording so spells don't play back to back too quickly
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      if (!prediction) {
        await new Promise((resolve) => {
          setTimeout(resolve, WAIT_TIME);
        });
      }
      return state;
    },
  },
};
export default spell;
