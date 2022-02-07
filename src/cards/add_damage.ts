import * as Unit from '../Unit';
import type { Spell } from '.';
import { MANA_BASE_COST, MANA_MULTIPLIER_NONE } from '../config';

const id = 'damage';
const damageDone = 3;
const spell: Spell = {
  card: {
    id,
    thumbnail: 'damage.png',
    probability: 50,
    description: `
Deals ${damageDone} damage to all targets.    
    `,
    manaCost: MANA_BASE_COST,
    manaMultiplier: MANA_MULTIPLIER_NONE,
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
