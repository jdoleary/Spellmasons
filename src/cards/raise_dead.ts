import * as Unit from '../Unit';
import type { Spell } from '.';
const id = 'resurrect';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'raise_dead.png',
    probability: 5,
    description: `
Resurrects a dead unit and converts them to the caster's faction.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const dead_unit = window.underworld.units.find(
          (u) => !u.alive && u.x === target.x && u.y === target.y,
        );
        if (dead_unit) {
          Unit.resurrect(dead_unit);
          dead_unit.health = 1;
          Unit.changeFaction(dead_unit, state.casterUnit.faction);
        }
      }
      return state;
    },
  },
};
export default spell;
