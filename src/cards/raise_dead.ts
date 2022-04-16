import * as Unit from '../Unit';
import type { Spell } from '.';

const id = 'resurrect';
// Brings stats back to this amount on res
const resStatAmount = 1.0;
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
      for (let unit of state.targetedUnits) {
        if (!unit.alive) {
          Unit.resurrect(unit);
          unit.health = unit.healthMax * resStatAmount;
          unit.mana = unit.manaMax * resStatAmount;
          Unit.changeFaction(unit, state.casterUnit.faction);
        }
      }
      return state;
    },
  },
};
export default spell;
