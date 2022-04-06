import * as Unit from '../Unit';
import { Spell, targetsToUnits } from '.';

export const id = 'hurt';
const damageDone = 2;
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
      if (dryRun) {
        return state;
      }
      let promises = [];
      for (let unit of targetsToUnits(state.targets)) {
        promises.push(Unit.takeDamage(unit, damageDone));
        state.aggregator.damageDealt =
          (state.aggregator.damageDealt || 0) + damageDone;
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
