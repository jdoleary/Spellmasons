import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { EffectFn, EffectState, ICard, refundLastSpell, Spell } from './index';
import * as math from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile } from '../entity/Projectile';
import { closestLineSegmentIntersectionWithLine, findWherePointIntersectLineSegmentAtRightAngle, LineSegment } from '../jmath/lineSegment';
import * as config from '../config';
import { add, equal, getAngleBetweenVec2s, getEndpointOfMagnitudeAlongVector, invert, subtract, Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import { moveAlongVector, normalizedVector } from '../jmath/moveWithCollision';

export const arrowCardId = 'Arrow';
const damageDone = 10;
const spell: Spell = {
  card: {
    id: arrowCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconArrow.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow', damageDone.toString()],
    effect: arrowEffect(1)
  }
};
export function arrowEffect(multiShotCount: number, onCollide?: (state: EffectState, firstTarget: Unit.IUnit, underworld: Underworld, prediction: boolean) => Promise<EffectState>) {
  return async (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean) => {

    let targets: Vec2[] = state.targetedUnits;
    const path = findArrowPath(state.casterPositionAtTimeOfCast, state.castLocation, underworld)
    targets = targets.length ? targets : [path ? path.p2 : state.castLocation];
    let targetsHitCount = 0;
    let attackPromises = [];
    let timeoutToNextArrow = 200;
    if (!prediction) {
      underworld.clearPredictedNextTurnDamage();
      for (let u of underworld.units) {
        // @ts-ignore: `currentHealth` is a temporary property on units
        // Keep the health that they had before arrows are fired
        // so that arrows can determine if they should go past
        // a unit that will die before it gets there due to
        // another in-flight arrow
        u.currentHealth = u.health;
      }
    }
    for (let i = 0; i < quantity; i++) {
      for (let target of targets) {
        let projectilePromise: Promise<EffectState> = Promise.resolve(state);
        for (let arrowNumber = 0; arrowNumber < multiShotCount; arrowNumber++) {

          // START: Shoot multiple arrows at offset
          let casterPositionAtTimeOfCast = state.casterPositionAtTimeOfCast;
          let castLocation = target;
          if (arrowNumber > 0) {
            const diff = subtract(casterPositionAtTimeOfCast, getEndpointOfMagnitudeAlongVector(casterPositionAtTimeOfCast, (arrowNumber == 2 ? -1 : 1) * Math.PI / 2 + getAngleBetweenVec2s(state.casterPositionAtTimeOfCast, state.castLocation), 20));
            casterPositionAtTimeOfCast = subtract(casterPositionAtTimeOfCast, diff);
            castLocation = subtract(castLocation, diff);
          }
          // END: Shoot multiple arrows at offset

          // const arrowUnitCollisions = findArrowCollisions(state.casterPositionAtTimeOfCast, state.casterUnit.id, target, prediction, underworld);
          const arrowUnitCollisions = findArrowCollisions(casterPositionAtTimeOfCast, state.casterUnit.id, castLocation, prediction, underworld);
          // This regular arrow spell doesn't pierce
          const firstTarget = arrowUnitCollisions[0];
          if (firstTarget) {
            playDefaultSpellSFX(card, prediction);
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
        }
        const timeout = Math.max(0, timeoutToNextArrow);
        await Promise.race([new Promise(resolve => setTimeout(resolve, timeout)), projectilePromise]);
        // Decrease timeout with each subsequent arrow fired to ensure that players don't have to wait too long
        timeoutToNextArrow -= 5;
      }
      await Promise.all(attackPromises).then(() => {
        // Since arrows' flight promises are designed to resolve early so that multiple arrows can be shot
        // in quick succession, we must await the actual flyingProjectile promise to determine if no targets
        // were hit
        if (targetsHitCount == 0) {
          refundLastSpell(state, prediction, 'no target, mana refunded')
        }
      });
      for (let u of underworld.units) {
        // @ts-ignore: `currentHealth` is a temporary property on units
        delete u.currentHealth;
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

export function findArrowCollisions(casterPositionAtTimeOfCast: Vec2, casterId: number, target: Vec2, prediction: boolean, underworld: Underworld): Vec2[] {
  const arrowShootPath = findArrowPath(casterPositionAtTimeOfCast, target, underworld);
  if (arrowShootPath === undefined) {
    return [];
  }
  // Get all units between source and target for the arrow to pierce:
  const hitTargets = (prediction ? underworld.unitsPrediction : underworld.units).filter(
    (u) => {
      if (!u.alive) {
        return false;
      }
      // Note: Filter out self as the arrow shouldn't damage caster
      if (u.id == casterId) {
        return false;
      }
      // @ts-ignore: `currentHealth` is a temporary property on units
      if (u.predictedNextTurnDamage >= u.currentHealth) {
        return false;
      }
      const pointAtRightAngleToArrowPath = findWherePointIntersectLineSegmentAtRightAngle(u, arrowShootPath);
      // TODO: Validate: Will this hit miniboss since their radius is larger?
      const willBeStruckByArrow = !pointAtRightAngleToArrowPath ? false : math.distance(u, pointAtRightAngleToArrowPath) <= config.COLLISION_MESH_RADIUS
      return willBeStruckByArrow;
    },
  ).sort((a, b) => {
    return math.distance(a, arrowShootPath.p1) - math.distance(b, arrowShootPath.p1);
  });
  // Return the endPoint so the arrow will fly and hit a wall even if it doesn't hit a unit
  return hitTargets.length ? hitTargets : [arrowShootPath.p2];
}