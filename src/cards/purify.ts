import { removeModifier } from '../Unit';
import type { Spell } from '.';
import { CardType, cardTypeToProbability } from './cardUtils';

const id = 'purify';
const type = CardType.Special;
// Removes all curse modifiers
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'purify.png',
    description: `
Removes all curses from the target(s).
    `,
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
