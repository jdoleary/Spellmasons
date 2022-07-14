import * as Unit from '../entity/Unit';
import type { Spell } from '.';

const id = 'mana_burn';
const mana_burnt = 30;
const health_burn_ratio = .1;
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'mana_burn.png',
    animationPath: 'spell-effects/spellManaBurn',
    description: `
Burn up to ${mana_burnt} of the targets' mana, causing the target take ${health_burn_ratio * 10} damage per 10 mana burnt.
    `,
    effect: async (state, prediction) => {
      for (let unit of state.targetedUnits) {
        const unitManaBurnt = Math.min(unit.mana, mana_burnt);
        unit.mana -= unitManaBurnt;
        const damage = unitManaBurnt * health_burn_ratio
        Unit.takeDamage(unit, damage, prediction, state);
      }
      return state;
    },
  },
};
export default spell;
