import { removeModifier } from '../Unit';
import type { Spell } from '.';
const id = 'purify';
// Removes all curse modifiers
const spell: Spell = {
  card: {
    id,
    thumbnail: 'purify.png',
    probability: 10,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target);
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
