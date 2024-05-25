import { addTarget, defaultTargetsForAllowNonUnitTargetTargetingSpell, getCurrentTargets, Spell } from './index';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import { Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';
import * as config from '../config';
import { easeOutCubic } from '../jmath/Easing';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { HasSpace } from '../entity/Type';
import { sortCosestTo, } from '../jmath/math';

const id = 'Target Circle';
const baseRadius = 100;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconExpanding.png',
    requiresFollowingCard: true,
    description: 'spell_target_circle',
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      // Slightly different / unique formula for balance purposes:
      // +100% range per quantity, +50% range per radius boost
      const adjustedRange = baseRadius * (quantity + (0.5 * state.aggregator.radiusBoost));

      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = getCurrentTargets(state);
      targets = defaultTargetsForAllowNonUnitTargetTargetingSpell(targets, state.castLocation, card);
      const length = targets.length;
      const animateCircles = [];
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        // Draw visual circle for prediction
        if (prediction) {
          if (outOfRange) {
            drawUICirclePrediction(target, adjustedRange, colors.outOfRangeGrey);
          } else {
            drawUICirclePrediction(target, adjustedRange, colors.targetingSpellGreen, 'Target Radius');
          }
        } else {
          animateCircles.push({ pos: target, radius: adjustedRange });
        }
        const withinRadius = underworld.getEntitiesWithinDistanceOfTarget(
          target,
          adjustedRange,
          prediction
        );
        // Sort by distance to circle center
        withinRadius.sort(sortCosestTo(target));
        // Add entities to target
        withinRadius.forEach(e => addTarget(e, state, underworld));
      }
      await animate(animateCircles, underworld);

      return state;
    },
  },
};
async function animate(circles: { pos: Vec2, radius: number }[], underworld: Underworld) {
  if (globalThis.headless) {
    // Animations do not occur on headless, so resolve immediately or else it
    // will just waste cycles on the server
    return Promise.resolve();
  }
  if (circles.length == 0) {
    // Prevent this function from running if there is nothing to animate
    return Promise.resolve();
  }
  const iterations = 100;
  const millisBetweenIterations = 12;
  // Keep track of which entities have been targeted so far for the sake
  // of making a new sfx when a new entity gets targeted
  const entitiesTargeted: HasSpace[] = [];
  playSFXKey('targeting');
  // "iterations + 10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + 10), 'animatedExpand', new Promise<void>(resolve => {
    for (let i = 0; i < iterations; i++) {

      setTimeout(() => {
        if (globalThis.predictionGraphics) {
          globalThis.predictionGraphics.clear();
          globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0)
          globalThis.predictionGraphics.beginFill(colors.targetingSpellGreen, 0.2);
          for (let circle of circles) {
            const { pos, radius } = circle;

            const animatedRadius = radius * easeOutCubic((i + 1) / iterations)
            globalThis.predictionGraphics.drawCircle(pos.x, pos.y, animatedRadius);
            globalThis.predictionGraphics.endFill();
            // Draw circles around new targets
            const withinRadius = underworld.getEntitiesWithinDistanceOfTarget(
              pos,
              animatedRadius,
              false
            );
            withinRadius.forEach(v => {
              if (!entitiesTargeted.includes(v)) {
                entitiesTargeted.push(v);
                playSFXKey('targetAquired');
              }
              globalThis.predictionGraphics?.drawCircle(v.x, v.y, config.COLLISION_MESH_RADIUS);
            })
          }
        }
        if (i >= iterations - 1) {
          resolve();
        }

      }, millisBetweenIterations * i)
    }
  })).then(() => {
    globalThis.predictionGraphics?.clear();
  });
}
export default spell;
