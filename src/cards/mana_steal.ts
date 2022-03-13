import * as Unit from '../Unit';
import type { Spell } from '.';
import { createVisualLobbingProjectile } from '../Projectile';
import floatingText from '../FloatingText';
import { CardType, cardTypeToProbability } from './cardUtils';

const id = 'mana_steal';
const mana_stolen = 8;
const health_burn = Math.max(mana_stolen / 10, 1)
const type = CardType.Special;
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'mana_steal.png',
    description: `
Sacrifice ${health_burn} of your own health to steal ${mana_stolen} from each target.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      const caster = state.casterUnit;
      // Take damage for to cast the steal
      let promises = [Unit.takeDamage(caster, health_burn)];
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          const unitManaBurnt = Math.min(unit.mana, mana_stolen);
          unit.mana -= unitManaBurnt;
          state.casterUnit.mana += unitManaBurnt;
          promises.push(createVisualLobbingProjectile(unit, caster.x, caster.y, 'blue-projectile.png').then(() => {
            floatingText({
              coords: caster,
              text: `+ ${unitManaBurnt} Mana`,
              style: { fill: 'blue' }
            })
          }));
        }
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
