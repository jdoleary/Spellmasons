import * as Unit from '../Unit';
import type { Spell } from '.';

const id = 'heal';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'heal.png',
    probability: 20,
    description: `
Heals all targets (no greater than maximum health).
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target);
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
