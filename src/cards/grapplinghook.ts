import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { pull } from './pull';

export const id = 'Grappling Hook';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'pull',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'unknown.png',
    description: `
Pulls the caster towards the target(s)
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        playDefaultSpellSFX(card, prediction);
        await pull(state.casterUnit, entity, quantity, underworld, prediction);
      }
      return state;
    },
  },
};
const velocity_falloff = 0.93;
export default spell;
