import { addTarget, getCurrentTargets, Spell } from './index';
import { drawUICone, drawUIPoly } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { getAngleBetweenVec2s, getEndpointOfMagnitudeAlongVector, invert, Vec2 } from '../jmath/Vec';
import { isAngleBetweenAngles } from '../jmath/Angle';
import { distance } from '../jmath/math';
import { moveAlongVector, normalizedVector } from '../jmath/moveWithCollision';
import { isVec2InsidePolygon } from '../jmath/Polygon2';

const id = 'Target Column';
const range = 200;
const baseWidth = 20;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'unknown.png',
    requiresFollowingCard: true,
    description: `
Adds targets to the spell in a column.
"${id}" can be cast multiple times in succession to expand the width of the column. 
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const depth = range + state.aggregator.radius;
      const width = baseWidth * quantity;
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      const length = targets.length;
      const vector = normalizedVector(state.casterUnit, state.castLocation).vector || { x: 0, y: 0 };
      const p1 = moveAlongVector(state.castLocation, invert(vector), -width);
      const p2 = moveAlongVector(state.castLocation, invert(vector), width);
      const p3 = moveAlongVector(p2, vector, depth);
      const p4 = moveAlongVector(p1, vector, depth);
      const targetingColumn = [p1, p2, p3, p4]
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        // Draw visual circle for prediction
        if (prediction) {
          const color = outOfRange ? colors.outOfRangeGrey : colors.targetingSpellGreen
          drawUIPoly(targetingColumn, color);
        } else {
          // TODO animate 
          // await animate(target, adjustedRange, underworld);
        }
        const withinColumn = underworld.getPotentialTargets(
          prediction
        ).filter(t => {
          return isVec2InsidePolygon(t, targetingColumn);
        });
        // Add entities to target
        withinColumn.forEach(e => addTarget(e, state));
      }

      return state;
    },
  },
};

export default spell;
