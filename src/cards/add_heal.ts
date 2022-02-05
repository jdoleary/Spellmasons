import * as Unit from '../Unit';
import type { Spell } from '.';
import { MANA_MULTIPLIER_NONE } from '../config';

const id = 'heal';
const healAmount = 10;
const manaCost = 20;

const spell: Spell = {
  card: {
    id,
    thumbnail: 'heal.png',
    probability: 20,
    description: `
Heals all targets ${healAmount} HP.
Will not heal beyond maximum health.
    `,
    manaCost,
    manaMultiplier: MANA_MULTIPLIER_NONE,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          const damage = -healAmount;
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
