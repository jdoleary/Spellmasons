import * as Unit from '../Unit';
import type { Spell } from '.';
import { MANA_BASE_COST, MANA_MULTIPLIER_NONE } from '../config';

const id = 'mana_burn';
const mana_burnt = MANA_BASE_COST;
const spell: Spell = {
  card: {
    id,
    thumbnail: 'todo.png',
    probability: 50,
    description: `
Burn ${mana_burnt} of the targets' mana, causing the target take damage and lose the mana.
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
          const unitManaBurnt = Math.min(unit.mana, mana_burnt);
          unit.mana -= unitManaBurnt;
          promises.push(Unit.takeDamage(unit, unitManaBurnt));
          state.aggregator.damageDealt =
            (state.aggregator.damageDealt || 0) + unitManaBurnt;
        }
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
