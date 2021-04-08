import * as Unit from '../Unit';
import type { Spell } from '.';

const spell: Spell = {
  card: {
    id: 'raise_dead',
    thumbnail: 'images/spell/raise_dead.png',
    probability: 5,
    effect: (state) => {
      for (let target of state.targets) {
        const dead_unit = window.game.units.find(
          (u) => !u.alive && u.x === target.x && u.y === target.y,
        );
        if (dead_unit) {
          Unit.resurrect(dead_unit);
          Unit.changeFaction(dead_unit, state.caster.unit.faction);
        }
      }
      return state;
    },
  },
};
export default spell;
