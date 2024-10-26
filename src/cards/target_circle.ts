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
interface Circle {
  pos: Vec2;
  radius: number;
}
const timeoutMsAnimation = 2000;

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
          drawUICirclePrediction(target, adjustedRange, 0xffffff, !outOfRange ? 'Target Radius' : undefined);
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
        withinRadius.forEach(e => addTarget(e, state, underworld, prediction));
      }
      await animate(animateCircles, underworld, prediction);

      return state;
    },
  },
};
async function animate(circles: Circle[], underworld: Underworld, prediction: boolean) {
  if (globalThis.headless || prediction) {
    // Animations do not occur on headless, so resolve immediately or else it
    // will just waste cycles on the server
    return Promise.resolve();
  }
  if (circles.length == 0) {
    // Prevent this function from running if there is nothing to animate
    return Promise.resolve();
  }
  // Keep track of which entities have been targeted so far for the sake
  // of making a new sfx when a new entity gets targeted
  const entitiesTargeted: HasSpace[] = [];
  playSFXKey('targeting');
  return raceTimeout(timeoutMsAnimation, 'animatedExpand', new Promise<void>(resolve => {
    animateFrame(circles, Date.now(), entitiesTargeted, underworld, resolve)();
  })).then(() => {
    globalThis.predictionGraphicsGreen?.clear();
  });
}

const millisToGrow = 1000;
function animateFrame(circles: Circle[], startTime: number, entitiesTargeted: HasSpace[], underworld: Underworld, resolve: (value: void | PromiseLike<void>) => void) {
  return function animateFrameInner() {
    if (globalThis.predictionGraphicsGreen) {
      globalThis.predictionGraphicsGreen.clear();
      globalThis.predictionGraphicsGreen.lineStyle(2, 0xffffff, 1.0)
      const now = Date.now();
      const timeDiff = now - startTime;
      for (let circle of circles) {
        const { pos, radius } = circle;

        const animatedRadius = radius * easeOutCubic(Math.min(1, timeDiff / millisToGrow));
        globalThis.predictionGraphicsGreen.drawCircle(pos.x, pos.y, animatedRadius);
        globalThis.predictionGraphicsGreen.endFill();
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
          globalThis.predictionGraphicsGreen?.drawCircle(v.x, v.y, config.COLLISION_MESH_RADIUS);
        })
      }
      if (timeDiff > millisToGrow) {
        resolve();
        return;
      } else {
        requestAnimationFrame(animateFrame(circles, startTime, entitiesTargeted, underworld, resolve));
      }
    } else {
      resolve();
    }

  }
}
export default spell;
