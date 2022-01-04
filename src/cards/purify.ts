import { removeModifier } from '../Unit';
import type { Spell } from '.';
import { MANA_BASE_COST, MANA_MULTIPLIER_NONE } from '../config';
const id = 'purify';
// Removes all curse modifiers
const spell: Spell = {
  card: {
    id,
    thumbnail: 'purify.png',
    probability: 10,
    description: `
Removes all curses from the target(s).
    `,
    manaCost: MANA_BASE_COST * 10,
    manaMultiplier: MANA_MULTIPLIER_NONE,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          for (let [modifier, modifierProperties] of Object.entries(
            unit.modifiers,
          )) {
            if (modifierProperties.isCurse) {
              removeModifier(unit, modifier);
            }
          }
        }
      }
      return state;
    },
  },
};
export default spell;
