import { addPickupTarget, addTarget, addTargetForCalculatedReturn, addUnitTarget, defaultTargetsForAllowNonUnitTargetTargetingSpell, getCurrentTargets, Spell } from './index';
import { drawUICircle } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import { Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';
import * as config from '../config';
import { easeOutCubic } from '../jmath/Easing';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { HasSpace } from '../entity/Type';

const id = 'Target Circle';
const baseRadius = 140;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconExpanding.png',
    requiresFollowingCard: true,
    description: 'spell_target_circle',
    allowNonUnitTarget: true,
    showPrediction: ({ targetedUnits, targetedPickups }, { quantity, aggregator }, outOfRange?: boolean) => {
      const adjustedRange = baseRadius * quantity + aggregator.radius;
      const targets: Vec2[] = [...targetedUnits, ...targetedPickups];
      for (let target of targets) {

        if (outOfRange) {
          drawUICircle(target, adjustedRange, colors.outOfRangeGrey);
        } else {
          drawUICircle(target, adjustedRange, colors.targetingSpellGreen, 'Target Radius');
        }
      }

    },
    animate: async ({ targetedUnits, targetedPickups, casterUnit, quantity, aggregator }, triggerEffectStage, underworld) => {
      const adjustedRange = baseRadius * quantity + aggregator.radius;
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = [...targetedUnits, ...targetedPickups];
      const length = targets.length;
      const animateCircles = [];
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        // Draw visual circle for prediction
        animateCircles.push({ pos: target, radius: adjustedRange });
      }
      await animate(animateCircles, underworld);
    },
    cacheSpellInvokation: (args, underworld, prediction) => {
      const calculatedReturn = {}
      const adjustedRange = baseRadius * args.quantity + args.aggregator.radius;
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = [...args.targetedUnits, ...args.targetedPickups];
      targets = defaultTargetsForAllowNonUnitTargetTargetingSpell(targets, args.castLocation, args.card);
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        const withinRadius = underworld.getEntitiesWithinDistanceOfTarget(
          target,
          adjustedRange,
          prediction
        );
        // Add entities to target
        withinRadius.forEach(e => addTargetForCalculatedReturn(e, calculatedReturn));
      }

      return calculatedReturn;
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
