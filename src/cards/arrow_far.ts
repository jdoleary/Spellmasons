import Underworld from '../Underworld';
import * as Unit from '../entity/Unit';
import * as config from '../config';
import { playDefaultSpellSFX } from './cardUtils';
import { EffectState, ICard, refundLastSpell, Spell } from './index';
import { CardCategory, CardRarity, probabilityMap } from '../types/commonTypes';
import * as math from '../jmath/math';
import { add, equal, invert, Vec2 } from '../jmath/Vec';
import { moveAlongVector, normalizedVector } from '../jmath/moveWithCollision';
import { closestLineSegmentIntersectionWithLine, LineSegment } from '../jmath/lineSegment';
import { findArrowCollisions } from './arrow';
import { createVisualFlyingProjectile } from '../entity/Projectile';

export const arrowFarCardId = 'Long Arrow';
const maxDamage = 50;
const maxDamageRange = 600;
function calculateDamage(casterPositionAtTimeOfCast: Vec2, target: Vec2): number {
  const dist = math.distance(casterPositionAtTimeOfCast, target)
  return Math.ceil(math.lerp(0, maxDamage, dist / maxDamageRange));
}

const spell: Spell = {
  card: {
    id: arrowFarCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconArrowRed.png', //TODO - Add Image
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_far', maxDamage.toString()], //TODO - Add description
    effect: arrowEffect(),
  }
};

export function arrowEffect(onCollide?: (state: EffectState, firstTarget: Unit.IUnit, underworld: Underworld, prediction: boolean) => Promise<EffectState>, skipClearCache?: boolean) {
  return async (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean) => {

    let targets: Vec2[] = state.targetedUnits;
    const path = findArrowPath(state.casterPositionAtTimeOfCast, state.castLocation, underworld)
    targets = targets.length ? targets : [path ? path.p2 : state.castLocation];
    let targetsHitCount = 0;
    let attackPromises = [];
    let timeoutToNextArrow = 200;
    if (!prediction) {
      if (!skipClearCache) {
        underworld.clearPredictedNextTurnDamage();
        for (let u of underworld.units) {
          // @ts-ignore: `cachedArrowHealth` is a temporary property on units
          // Keep the health that they had before arrows are fired
          // so that arrows can determine if they should go past
          // a unit that will die before it gets there due to
          // another in-flight arrow
          u.cachedArrowHealth = u.health;
        }
      }
    }
    for (let i = 0; i < quantity; i++) {
      for (let target of targets) {
        let projectilePromise: Promise<EffectState> = Promise.resolve(state);

        let casterPositionAtTimeOfCast = state.casterPositionAtTimeOfCast;
        let castLocation = target;

        // const arrowUnitCollisions = findArrowCollisions(state.casterPositionAtTimeOfCast, state.casterUnit.id, target, prediction, underworld);
        const arrowUnitCollisions = findArrowCollisions(casterPositionAtTimeOfCast, state.casterUnit.id, castLocation, prediction, underworld);
        // This arrow spell doesn't pierce
        const firstTarget = arrowUnitCollisions[0];
        if (firstTarget) {
          playDefaultSpellSFX(card, prediction);
          const damageDone = calculateDamage(state.casterPositionAtTimeOfCast, firstTarget);
          if (!prediction && !globalThis.headless) {
            if (Unit.isUnit(firstTarget)) {
              underworld.incrementTargetsNextTurnDamage([firstTarget], damageDone, true);
            }
            // Promise.race ensures arrow promise doesn't take more than X milliseconds so that multiple arrows cast
            // sequentially wont take too long to complete animating.
            // Note: I don't forsee any issues with the following spell (say if a spell was chained after arrow) executing
            // early
            projectilePromise = createVisualFlyingProjectile(
              casterPositionAtTimeOfCast,
              castLocation,
              'projectile/arrow',
              firstTarget
            ).then(() => {
              if (Unit.isUnit(firstTarget)) {
                Unit.takeDamage(firstTarget, damageDone, state.casterPositionAtTimeOfCast, underworld, prediction, undefined, { thinBloodLine: true });
                targetsHitCount++;
                if (onCollide) {
                  return onCollide(state, firstTarget, underworld, prediction);
                }
              }
              return Promise.resolve(state);
            }).then((state) => {
              return state
            });
            attackPromises.push(projectilePromise);
          } else {
            if (Unit.isUnit(firstTarget)) {
              Unit.takeDamage(firstTarget, damageDone, state.casterPositionAtTimeOfCast, underworld, prediction, undefined, { thinBloodLine: true });
              targetsHitCount++;
              if (onCollide) {
                onCollide(state, firstTarget, underworld, prediction);
              }
            }
          }
        }
        if (!prediction && !globalThis.headless) {
          const timeout = Math.max(0, timeoutToNextArrow);
          await Promise.race([new Promise(resolve => setTimeout(resolve, timeout)), projectilePromise]);
          // Decrease timeout with each subsequent arrow fired to ensure that players don't have to wait too long
          timeoutToNextArrow -= 5;
        }
      }
    }
    await Promise.all(attackPromises).then(() => {
      // Since arrows' flight promises are designed to resolve early so that multiple arrows can be shot
      // in quick succession, we must await the actual flyingProjectile promise to determine if no targets
      // were hit
      if (targetsHitCount == 0) {
        refundLastSpell(state, prediction, 'no target, mana refunded')
      }
    });
    if (!skipClearCache) {
      for (let u of underworld.units) {
        // @ts-ignore: `cachedArrowHealth` is a temporary property on units
        delete u.cachedArrowHealth;
      }
    }
    return state;
  }
}
export default spell;

// Returns the start and end point that an arrow will take until it hits a wall
export function findArrowPath(casterPositionAtTimeOfCast: Vec2, target: Vec2, underworld: Underworld): LineSegment | undefined {
  if (equal(casterPositionAtTimeOfCast, target)) {
    // Don't allow shooting arrow at self, an arrow needs a direction
    return undefined;
  }
  // Find a point that the arrow is shooting towards that is sure to be farther than the farthest wall
  let endPoint = add(casterPositionAtTimeOfCast, math.similarTriangles(target.x - casterPositionAtTimeOfCast.x, target.y - casterPositionAtTimeOfCast.y, math.distance(casterPositionAtTimeOfCast, target), 10000));
  let arrowShootPath = { p1: casterPositionAtTimeOfCast, p2: endPoint };
  // revise end point to stop where it hits the first wall
  const LOSResult = closestLineSegmentIntersectionWithLine(arrowShootPath, underworld.walls);
  let intersection = LOSResult ? LOSResult.intersection : undefined;
  if (intersection) {
    // If arrow intersects with wall
    // modify intersection so that it lands in game space and not out of bounds.
    // This ensures target_arrow can't spawn units out of bounds:
    // It should have no meaninful effect on other arrows
    if (LOSResult?.lineSegment) {
      const wallVector = normalizedVector(LOSResult.lineSegment.p2, LOSResult.lineSegment.p1);
      if (wallVector.vector) {
        intersection = moveAlongVector(intersection, invert(wallVector.vector), config.COLLISION_MESH_RADIUS / 2);
      }
    }

    endPoint = intersection;
    // revise arrow shoot path now that endpoint has changed
    return { p1: casterPositionAtTimeOfCast, p2: endPoint };
  } else {
    console.error('Unexpected: arrow couldnt find wall to intersect with');
    return { p1: casterPositionAtTimeOfCast, p2: target };
  }

}