import * as Unit from '../Unit';
import { Spell, tallyUnitDamage, targetsToUnits } from '.';

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
    probability: 50,
    thumbnail: 'damage.png',
    description: `
Deals ${damageDone} damage to all targets.    
    `,
    effect: async (state, dryRun) => {
      for (let unit of targetsToUnits(state.targets)) {
        Unit.takeDamage(unit, damageDone, dryRun, state);
      }
      return state;
    },
  },
};
export default spell;
