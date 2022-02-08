import * as Unit from '../Unit';
import type { Spell } from '.';
import { CardType, cardTypeToProbability } from './cardUtils';

const id = 'resurrect';
const type = CardType.Powerful;
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'raise_dead.png',
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
