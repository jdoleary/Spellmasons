import { removeModifier } from '../Unit';
import type { Spell } from '.';

const id = 'purify';
// Removes all curse modifiers
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    probability: 10,
    thumbnail: 'purify.png',
    description: `
Removes all curses from the target(s).
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let unit of state.targetedUnits) {
        for (let [modifier, modifierProperties] of Object.entries(
          unit.modifiers,
        )) {
          if (modifierProperties.isCurse) {
            removeModifier(unit, modifier);
          }
        }
      }
      return state;
    },
  },
};
export default spell;
