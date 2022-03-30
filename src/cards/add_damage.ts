import * as Unit from '../Unit';
import type { Spell } from '.';

const id = 'damage';
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
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          promises.push(Unit.takeDamage(unit, damageDone));
          state.aggregator.damageDealt =
            (state.aggregator.damageDealt || 0) + damageDone;
        }
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
