import * as Unit from '../Unit';
import { Spell, targetsToUnits } from '.';
import { createVisualLobbingProjectile } from '../Projectile';
import floatingText from '../FloatingText';

const id = 'mana_steal';
const mana_stolen = 20;
const health_burn = Math.max(mana_stolen / 10, 1)
const spell: Spell = {
  card: {
    id,
    manaCost: 0,
    healthCost: health_burn,
    probability: 20,
    thumbnail: 'mana_steal.png',
    description: `
Sacrifice ${health_burn} of your own health to steal up to ${mana_stolen} mana from each target.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      const caster = state.casterUnit;
      let promises = [];
      for (let unit of targetsToUnits(state.targets)) {
        const unitManaBurnt = Math.min(unit.mana, mana_stolen);
        unit.mana -= unitManaBurnt;
        // Sync UI in case mana is stolen from the player
        Unit.syncPlayerHealthManaUI();
        promises.push(createVisualLobbingProjectile(unit, caster.x, caster.y, 'blue-projectile.png').then(() => {
          state.casterUnit.mana += unitManaBurnt;
          // Sync UI in case the casterUnit IS the player and is getting this mana
          Unit.syncPlayerHealthManaUI();
          floatingText({
            coords: caster,
            text: `+ ${unitManaBurnt} Mana`,
            style: { fill: 'blue' }
          })
        }));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
