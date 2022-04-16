import * as Unit from '../Unit';
import type { Spell } from '.';

const id = 'mana_burn';
const mana_burnt = 30;
const health_burn_ratio = .1;
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    probability: 10,
    thumbnail: 'mana_burn.png',
    description: `
Burn up to ${mana_burnt} of the targets' mana, causing the target take ${health_burn_ratio * 10} damage per 10 mana burnt.
    `,
    effect: async (state, dryRun) => {
      for (let unit of state.targetedUnits) {
        const unitManaBurnt = Math.min(unit.mana, mana_burnt);
        if (!dryRun) {
          unit.mana -= unitManaBurnt;
        }
        const damage = unitManaBurnt * health_burn_ratio
        Unit.takeDamage(unit, damage, dryRun, state);
      }
      return state;
    },
  },
};
export default spell;
