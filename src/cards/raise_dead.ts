import * as Unit from '../Unit';
import { Spell, targetsToUnits } from '.';

const id = 'resurrect';
const spell: Spell = {
  card: {
    id,
    manaCost: 50,
    healthCost: 0,
    probability: 5,
    thumbnail: 'raise_dead.png',
    description: `
Resurrects a dead unit and converts them to the caster's faction.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let unit of targetsToUnits(state.targets)) {
        if (!unit.alive) {
          Unit.resurrect(unit);
          unit.health = 1;
          Unit.changeFaction(unit, state.casterUnit.faction);
        }
      }
      return state;
    },
  },
};
export default spell;
