import * as Unit from '../Unit';
import type { Spell } from '.';
const id = 'raise_dead';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'spell/raise_dead.png',
    probability: 5,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const dead_unit = window.game.units.find(
          (u) => !u.alive && u.x === target.x && u.y === target.y,
        );
        if (dead_unit) {
          Unit.resurrect(dead_unit);
          dead_unit.health = 1;
          Unit.changeFaction(dead_unit, state.caster.unit.faction);
        }
      }
      return state;
    },
  },
};
export default spell;
