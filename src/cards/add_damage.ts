import * as Unit from '../Unit';
import type { Spell } from '.';

export const id = 'hurt';
const damageDone = 2;
export interface UnitDamage {
  id: number;
  x: number;
  y: number;
  health: number;
  damageTaken: number;

}
const spell: Spell = {
  card: {
    id,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'damage.png',
    description: `
Deals ${damageDone} damage to all targets.    
    `,
    effect: async (state, prediction) => {
      for (let unit of state.targetedUnits) {
        Unit.takeDamage(unit, damageDone, prediction, state);
      }
      return state;
    },
  },
};
export default spell;
