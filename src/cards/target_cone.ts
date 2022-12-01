import { addTarget, getCurrentTargets, Spell } from './index';
import { drawUICone, rawDrawUICone } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { getAngleBetweenVec2s, Vec2 } from '../jmath/Vec';
import { isAngleBetweenAngles } from '../jmath/Angle';
import { distance } from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { raceTimeout } from '../Promise';
import { easeOutCubic } from '../jmath/Easing';
import * as config from '../config';
import { HasSpace } from '../entity/Type';

const id = 'Target Cone';
const range = 240;
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
          drawUICone(target, adjustedRange, startAngle, endAngle, color);
        } else {
          await animate(state.casterUnit, target, adjustedRange, startAngle, endAngle, underworld);
        }
        const withinRadiusAndAngle = underworld.getPotentialTargets(
          prediction
        ).filter(t => {
          return withinCone(state.casterUnit, target, adjustedRange, startAngle, endAngle, t);
        });
        // Add entities to target
        withinRadiusAndAngle.forEach(e => addTarget(e, state));
      }

      return state;
    },
  },
};
// Returns true if target is within cone
function withinCone(origin: Vec2, coneStartPoint: Vec2, radius: number, startAngle: number, endAngle: number, target: Vec2): boolean {
  // and within angle:
  const targetAngle = getAngleBetweenVec2s(coneStartPoint, target);
  const distanceToOrigin = distance(origin, target);
  const distanceToConeStart = distance(origin, coneStartPoint);
  return distanceToOrigin >= distanceToConeStart && distanceToOrigin - distanceToConeStart <= radius
    && isAngleBetweenAngles(targetAngle, startAngle, endAngle);

}

async function animate(origin: Vec2, coneStartPoint: Vec2, radius: number, startAngle: number, endAngle: number, underworld: Underworld) {
  const iterations = 100;
  const millisBetweenIterations = 8;
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

          const animatedRadius = radius * easeOutCubic((i + 1) / iterations);

          rawDrawUICone(coneStartPoint, animatedRadius, startAngle, endAngle, colors.targetingSpellGreen, globalThis.predictionGraphics);
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
              let sfxNumber = Math.floor(i / (iterations / 4));
              playSFXKey(`targetAquired${sfxNumber}`);
            }
            globalThis.predictionGraphics?.drawCircle(v.x, v.y, config.COLLISION_MESH_RADIUS);
          })
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
