import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { pull } from './pull';

export const id = 'vortex';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'pull',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'unknown.png',
    description: `
Pulls the target(s) towards the cast location.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        promises.push(pull(entity, state.castLocation, quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
