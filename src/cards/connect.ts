import { drawPredictionCircleFill, drawPredictionLine } from '../graphics/PlanningView';
import { addUnitTarget, Spell } from './index';
import type * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';

const id = 'Connect';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'spellIconConnect.png',
    requiresFollowingCard: true,
    description: `
Link together enemies (and allys) in close proximity to each other.  All connected beings will be affected by the following spells in your cast.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // Note: This loop must NOT be a for..of because it
      // mutates state.targetedUnits as it iterates.
      for (let i = 0; i < state.targetedUnits.length; i++) {
        const unit = state.targetedUnits[i];
        if (unit) {
          // Draw visual circle for prediction
          drawPredictionCircleFill(unit, range);
          // Find all units touching the spell origin
          const chained_units = getTouchingUnitsRecursive(
            unit.x,
            unit.y,
            underworld,
            prediction,
            state.targetedUnits
          );
          // Update targetedUnits
          chained_units.forEach(u => addUnitTarget(u, state))
        }
      }

      return state;
    },
  },
};
const range = 105;
function getTouchingUnitsRecursive(
  x: number,
  y: number,
  underworld: Underworld,
  prediction: boolean,
  ignore: Unit.IUnit[] = [],
): Unit.IUnit[] {
  const units = prediction ? underworld.unitsPrediction : underworld.units;
  let touching = units.filter((u) => {
    return (
      u.x <= x + range &&
      u.x >= x - range &&
      u.y <= y + range &&
      u.y >= y - range &&
      !ignore.find((i) => i.x == u.x && i.y == u.y)
    );
  });
  ignore.push(...touching);
  // Draw prediction lines so user can see how it chains
  touching.forEach(chained_unit => {
    drawPredictionLine({ x, y }, chained_unit);
  })
  for (let u of touching) {
    touching = touching.concat(
      getTouchingUnitsRecursive(u.x, u.y, underworld, prediction, ignore),
    );
  }
  return touching;
}
export default spell;
