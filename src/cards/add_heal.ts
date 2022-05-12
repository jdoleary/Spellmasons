import * as Unit from '../Unit';
import type { Spell } from '.';

const id = 'heal';
const healAmount = 3;

const spell: Spell = {
  card: {
    id,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'heal.png',
    description: `
Heals all targets ${healAmount} HP.
Will not heal beyond maximum health.
    `,
    effect: async (state, prediction) => {
      for (let unit of state.targetedUnits) {
        const damage = -healAmount;
        Unit.takeDamage(unit, damage, prediction, state);
      }
      return state;
    },
  },
};
export default spell;
