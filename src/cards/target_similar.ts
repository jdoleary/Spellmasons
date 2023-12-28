import { addTarget, EffectState, getCurrentTargets, ICard, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { Vec2, add, subtract } from '../jmath/Vec';
import * as math from '../jmath/math';
import { isUnit } from '../entity/Unit';
import { isPickup } from '../entity/Pickup';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { raceTimeout } from '../Promise';
import { easeOutCubic } from '../jmath/Easing';
import * as config from '../config';
import * as colors from '../graphics/ui/colors';
import { HasSpace } from '../entity/Type';
import Underworld from '../Underworld';

export const targetSimilarId = 'Target Similar';
const spell: Spell = {
  card: {
    id: targetSimilarId,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    thumbnail: 'spellIconTargetSimilar.png',
    requiresFollowingCard: true,
    description: 'spell_target_similar',
    allowNonUnitTarget: true,
    effect: targetSimilarEffect(1),
  }
};
export function targetSimilarEffect(numberOfTargets: number) {
  return async (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean) => {
    // Note: This loop must NOT be a for..of and it must cache the length because it
    // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
    let targets: Vec2[] = getCurrentTargets(state);
    targets = targets.length ? targets : [state.castLocation];
    const length = targets.length;
    const animators = [];
    const newTargets: HasSpace[] = [];
    for (let i = 0; i < length; i++) {
      // Refresh the targets array so it excludes reselecting a target that was selected by the last iteration
      targets = getCurrentTargets(state);
      const target = targets[i];
      if (!target) {
        continue;
      }

      const potentialTargets = underworld.getPotentialTargets(prediction)
        // Filter out current targets
        .filter(t => !targets.includes(t))
        // Filter out current targets (workaround for prediction discrepancy)
        // This workaround is needed because if a unit is created during prediction,
        // a copy of it is made, causing targets.includes return incorrectly.
        .filter(t => {
          if (isUnit(t) && targets.find(u => isUnit(u) && t.id == u.id)) {
            return false;
          } else if (isPickup(t) && targets.find(p => isPickup(p) && t.id == p.id)) {
            return false
          }
          return true;
        })
        // Filter out dissimilar types
        // @ts-ignore Find similar units by unitSourceId, find similar pickups by name
        .filter(t => {
          if (isUnit(target)) {
            return isUnit(t) && t.unitSourceId == target.unitSourceId && t.alive == target.alive && t.faction == target.faction;
          } else if (isPickup(target)) {
            return isPickup(t) && t.name == target.name;
          }
        })
        .sort((a, b) => math.distance(a, target) - math.distance(b, target));

      const tempNewTargets = potentialTargets.slice(0, numberOfTargets * quantity)
      tempNewTargets.forEach(t => newTargets.push(t));
      if (!prediction) {
        playSFXKey('targeting');
        animators.push({ pos: target, newTargets: tempNewTargets });
      }

      for (let newTarget of newTargets) {
        addTarget(newTarget, state);
      }
    }

    await animateTargetSimilar(animators);

    return state;
  }

}

export async function animateTargetSimilar(circles: { pos: Vec2, newTargets: Vec2[] }[]) {
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
  const millisBetweenIterations = 4;
  const extraIterationsToShowAnimatedCircleAtEnd = 40;
  // "+10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + extraIterationsToShowAnimatedCircleAtEnd + 10), 'animatedConnect', new Promise<void>(resolve => {
    // +extraIterations... gives iterations some time to show the circle at the end
    for (let i = 0; i < iterations + extraIterationsToShowAnimatedCircleAtEnd; i++) {

      setTimeout(() => {
        if (globalThis.predictionGraphics) {
          globalThis.predictionGraphics.clear();
          globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0);
          for (let { pos, newTargets } of circles) {
            // between 0 and 1;
            const proportionComplete = easeOutCubic((i + 1) / iterations);
            newTargets.forEach(target => {

              globalThis.predictionGraphics?.moveTo(pos.x, pos.y);
              const dist = math.distance(pos, target)
              const edgeOfCircle = add(target, math.similarTriangles(pos.x - target.x, pos.y - target.y, dist, config.COLLISION_MESH_RADIUS));
              const pointApproachingTarget = add(pos, math.similarTriangles(edgeOfCircle.x - pos.x, edgeOfCircle.y - pos.y, dist, dist * Math.min(1, proportionComplete)));
              globalThis.predictionGraphics?.lineTo(pointApproachingTarget.x, pointApproachingTarget.y);
              if (proportionComplete >= 1) {
                globalThis.predictionGraphics?.drawCircle(target.x, target.y, config.COLLISION_MESH_RADIUS);
                playSFXKey('targetAquired');
              }
            });
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