import type { Spell } from '.';
import { createVisualLobbingProjectile } from '../entity/Projectile';
import floatingText from '../graphics/FloatingText';
import { explainManaOverfill } from '../graphics/Jprompt';

const id = 'mana_steal';
const mana_stolen = 20;
const health_burn = 3;
const spell: Spell = {
  card: {
    id,
    manaCost: 0,
    healthCost: health_burn,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'mana_steal.png',
    description: `
Sacrifice some of own health to steal up to ${mana_stolen} mana from each target.
    `,
    effect: async (state, prediction) => {
      const caster = state.casterUnit;
      let promises = [];
      for (let unit of state.targetedUnits) {
        const unitManaBurnt = Math.min(unit.mana, mana_stolen);
        unit.mana -= unitManaBurnt;
        promises.push((prediction ? Promise.resolve() : createVisualLobbingProjectile(unit, caster, 'blue-projectile.png')).then(() => {
          state.casterUnit.mana += unitManaBurnt;
          if (!prediction) {
            explainManaOverfill();
            floatingText({
              coords: caster,
              text: `+ ${unitManaBurnt} Mana`,
              style: { fill: 'blue' }
            })
          }
        }));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
