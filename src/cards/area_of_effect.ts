import { addPickupTarget, addUnitTarget, Spell } from './index';
import { drawPredictionCircle } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import { Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';
import * as config from '../config';

const id = 'Expanding';
const range = 140;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'spellIconExpanding.png',
    requiresFollowingCard: true,
    description: `
Adds a radius to the spell so it can affect more targets.
"Expanding" can be cast multiple times in succession to stack it's effect.
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const adjustedRange = range * quantity;
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      const targets = state.targetedUnits.length ? state.targetedUnits : [state.castLocation];
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        // Draw visual circle for prediction
        if (prediction) {
          if (outOfRange) {
            drawPredictionCircle(target, adjustedRange, colors.outOfRangeGrey);
          } else {
            drawPredictionCircle(target, adjustedRange, colors.targetingSpellGreen, 'Expand Radius');
          }
        } else {
          await animate(target, adjustedRange, underworld);
        }
        const withinRadius = underworld.getUnitsWithinDistanceOfTarget(
          target,
          adjustedRange,
          prediction
        );
        // Add units to target
        withinRadius.forEach(unit => addUnitTarget(unit, state));

        const pickupsWithinRadius = underworld.getPickupsWithinDistanceOfTarget(
          target,
          adjustedRange,
          prediction
        );
        // Add pickups to target
        pickupsWithinRadius.forEach(unit => addPickupTarget(unit, state));
      }

      return state;
    },
  },
};
async function animate(pos: Vec2, radius: number, underworld: Underworld) {
  const iterations = 100;
  const millisBetweenIterations = 8;
  // "iterations + 10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + 10), 'animatedExpand', new Promise<void>(resolve => {
    for (let i = 0; i < iterations; i++) {

      setTimeout(() => {
        if (predictionGraphics) {
          predictionGraphics.clear();
          predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0)
          predictionGraphics.beginFill(colors.targetingSpellGreen, 0.2);

          const animatedRadius = radius * easeOutCubic((i + 1) / iterations)
          predictionGraphics.drawCircle(pos.x, pos.y, animatedRadius);
          predictionGraphics.endFill();
          // Draw circles around new targets
          let withinRadius: Vec2[] = [];
          withinRadius = withinRadius.concat(
            underworld.getUnitsWithinDistanceOfTarget(
              pos,
              animatedRadius,
              false
            ),
            underworld.getPickupsWithinDistanceOfTarget(
              pos,
              animatedRadius,
              false
            ));
          withinRadius.forEach(v => {
            predictionGraphics?.drawCircle(v.x, v.y, config.COLLISION_MESH_RADIUS);
          })
        }
        if (i >= iterations - 1) {
          resolve();
        }

      }, millisBetweenIterations * i)
    }
  })).then(() => {
    predictionGraphics?.clear();
  });
}
// from https://easings.net/
// input should be 0 - 1
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}
export default spell;
