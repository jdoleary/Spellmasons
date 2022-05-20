import * as Unit from '../Unit';
import type { Spell } from '.';

const id = 'resurrect';
// Brings stats back to this amount on res
const resStatAmount = 1.0;
const spell: Spell = {
  card: {
    id,
    manaCost: 80,
    healthCost: 0,
    expenseScaling: 2,
    probability: 5,
    thumbnail: 'raise_dead.png',
    description: `
Resurrects a dead unit and converts them to the caster's faction.
    `,
    effect: async (state, prediction) => {
      // If there is a living unit atop a dead unit at the cast location, specifically target the dead unit
      // so the spell doesn't fizzle.
      const firstDeadUnitAtCastLocation = window.underworld.getUnitsAt(state.castLocation, prediction).filter(u => !u.alive)[0]
      for (let unit of [firstDeadUnitAtCastLocation, ...state.targetedUnits]) {
        if (unit && !unit.alive) {
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
