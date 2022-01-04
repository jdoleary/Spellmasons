import * as Unit from '../Unit';
import type { Spell } from '.';
import { MANA_BASE_COST, MANA_MULTIPLIER_NONE } from '../config';

const id = 'heal';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'heal.png',
    probability: 20,
    description: `
Heals all targets (no greater than maximum health).
    `,
    manaCost: MANA_BASE_COST,
    manaMultiplier: MANA_MULTIPLIER_NONE,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          const damage = -1;
          Unit.takeDamage(unit, damage);
          state.aggregator.damageDealt =
            (state.aggregator.damageDealt || 0) + damage;
        }
      }
      return state;
    },
  },
};
export default spell;
