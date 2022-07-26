import * as Unit from '../entity/Unit';
import { Spell } from './index';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';

const id = 'purify';
// Removes all curse modifiers
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'purify.png',
    animationPath: 'spell-effects/spellPurify',
    description: `
Removes all curses from the target(s).
    `,
    effect: async (state, underworld, prediction) => {
      for (let unit of state.targetedUnits) {
        apply(unit, underworld)
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
