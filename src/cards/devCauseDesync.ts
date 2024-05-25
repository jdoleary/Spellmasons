import { Spell } from './index';
import { CardCategory } from '../types/commonTypes';

const id = 'Dev Cause Desync';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    sfx: '',
    manaCost: 15,
    healthCost: 0,
    probability: 0,
    expenseScaling: 1,
    thumbnail: 'unknown.png',
    description: `
    Moves the first targeted unit on the client ONLY causing a desync between the server and the client
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      if (prediction &&
        globalThis.headless) {
        return state;
      } else {
        if (state.targetedUnits[0]) {
          state.targetedUnits[0].x += 100;
          state.targetedUnits[0].health = 1;
        }
      }
      return state;
    },
  },
};
export default spell;
