import * as Unit from '../entity/Unit';
import { Spell } from './index';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';

const id = 'purify';
// Removes all curse modifiers
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    sfx: 'purify',
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'spellIconPurify.png',
    animationPath: 'spell-effects/spellPurify',
    description: `
Removes all curses from the target(s).
A curse is a harmful modifier that is attached to a unit: for example: poison, bloat, and freeze are curses.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          apply(unit, underworld)
        }
      }
      return state;
    },
  },
};
export function apply(unit: Unit.IUnit, underworld: Underworld) {
  for (let [modifier, modifierProperties] of Object.entries(
    unit.modifiers,
  )) {
    if (modifierProperties.isCurse) {
      Unit.removeModifier(unit, modifier, underworld);
    }
  }
}
export default spell;
