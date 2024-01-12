import { addTarget, defaultTargetsForAllowNonUnitTargetTargetingSpell, getCurrentTargets, Spell } from './index';
import { drawUIConePrediction, drawUICone } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { getAngleBetweenVec2s, Vec2 } from '../jmath/Vec';
import { isAngleBetweenAngles } from '../jmath/Angle';
import { distance, sortCosestTo } from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { raceTimeout } from '../Promise';
import { easeOutCubic } from '../jmath/Easing';
import * as config from '../config';
import { HasSpace } from '../entity/Type';

export const id = 'Target Cone';
const range = 200;
const coneAngle = Math.PI / 4
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconTargetCone.png',
    requiresFollowingCard: true,
    description: 'spell_target_cone',
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      // Range increases linearly with each quantity
      const adjustedRange = (range + state.aggregator.radius) * (0.75 + 0.25 * quantity);
      // Angle doubles up to 4 casts, capping at 360 degrees: 45 > 90 > 180 > full circle
      const adjustedAngle = coneAngle * Math.pow(2, Math.min(quantity, 4)) / 2;

      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = getCurrentTargets(state);
      targets = defaultTargetsForAllowNonUnitTargetTargetingSpell(targets, state.castLocation, card);
      const length = targets.length;
      const projectAngle = getAngleBetweenVec2s(state.casterUnit, state.castLocation);
      const startAngle = projectAngle + adjustedAngle / 2;
      const endAngle = projectAngle - adjustedAngle / 2;
      const animatedCones = [];
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        // Draw visual circle for prediction
        if (prediction) {
          const color = outOfRange ? colors.outOfRangeGrey : colors.targetingSpellGreen
          drawUIConePrediction(target, adjustedRange, startAngle, endAngle, color);
        } else {
          animatedCones.push({ origin: state.casterUnit, coneStartPoint: target, radius: adjustedRange, startAngle, endAngle });
        }
        const withinRadiusAndAngle = underworld.getPotentialTargets(
          prediction
        ).filter(t => {
          return withinCone(state.casterUnit, target, adjustedRange, startAngle, endAngle, t);
        });
        // Sort by distance to cone start
        withinRadiusAndAngle.sort(sortCosestTo(target));
        // Add entities to target
        withinRadiusAndAngle.forEach(e => addTarget(e, state));
      }
      await animate(animatedCones, underworld);

      return state;
    },
  },
};
// Returns true if target is within cone
function withinCone(origin: Vec2, coneStartPoint: Vec2, radius: number, startAngle: number, endAngle: number, target: Vec2): boolean {
  // and within angle:
  const targetAngle = getAngleBetweenVec2s(coneStartPoint, target);
  const distanceToConeStart = distance(target, coneStartPoint);

  //TODO - Investigate isAngleBetweenAngles
  //temp fix for cone inversion: if angle is whole circle, just check distance.
  return distanceToConeStart <= radius
    && (isAngleBetweenAngles(targetAngle, startAngle, endAngle) || Math.abs(endAngle - startAngle) >= 2 * Math.PI);
}

async function animate(cones: { origin: Vec2, coneStartPoint: Vec2, radius: number, startAngle: number, endAngle: number }[], underworld: Underworld) {
  if (globalThis.headless) {
    // Animations do not occur on headless, so resolve immediately or else it
    // will just waste cycles on the server
    return Promise.resolve();
  }
  if (cones.length == 0) {
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
          globalThis.predictionGraphics.beginFill(colors.targetingSpellGreen, 0.2);
          for (let cone of cones) {

            const { radius, origin, coneStartPoint, startAngle, endAngle } = cone;

            const animatedRadius = radius * easeOutCubic((i + 1) / iterations);

            drawUICone(globalThis.predictionGraphics, coneStartPoint, animatedRadius, startAngle, endAngle, colors.targetingSpellGreen);
            globalThis.predictionGraphics.endFill();
            // Draw circles around new targets
            const withinRadiusAndAngle = underworld.getPotentialTargets(
              false
            ).filter(t => {
              return withinCone(origin, coneStartPoint, animatedRadius, startAngle, endAngle, t);
            });
            withinRadiusAndAngle.forEach(v => {
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
