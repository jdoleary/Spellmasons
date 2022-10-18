import { addTarget, getCurrentTargets, Spell } from './index';
import { drawUICone } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { getAngleBetweenVec2s, Vec2 } from '../jmath/Vec';
import { isAngleBetweenAngles } from '../jmath/Angle';
import { distance } from '../jmath/math';

const id = 'Target Cone';
const range = 240;
const coneAngle = Math.PI / 4
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
Adds targets to the spell in a cone shape.
"${id}" can be cast multiple times in succession to expand the angle of the cone.
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const adjustedRange = range + state.aggregator.radius;
      const adjustedAngle = coneAngle * quantity;
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      const length = targets.length;
      const projectAngle = getAngleBetweenVec2s(state.casterUnit, state.castLocation);
      const startAngle = projectAngle + adjustedAngle / 2;
      const endAngle = projectAngle - adjustedAngle / 2;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        // Draw visual circle for prediction
        if (prediction) {
          const color = outOfRange ? colors.outOfRangeGrey : colors.targetingSpellGreen
          drawUICone(target, adjustedRange, endAngle, startAngle, color);
        } else {
          // TODO animate target cone
          // await animate(target, adjustedRange, underworld);
        }
        const withinRadiusAndAngle = underworld.getEntitiesWithinDistanceOfTarget(
          target,
          adjustedRange,
          prediction
        ).filter(t => {
          // and within angle:
          const targetAngle = getAngleBetweenVec2s(state.casterUnit, t);
          return distance(state.casterUnit, t) >= distance(state.casterUnit, state.castLocation)
            && isAngleBetweenAngles(targetAngle, startAngle, endAngle);
        });
        // Add entities to target
        withinRadiusAndAngle.forEach(e => addTarget(e, state));
      }

      return state;
    },
  },
};

export default spell;
