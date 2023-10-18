import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { refundLastSpell, Spell } from './index';
import * as math from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile } from '../entity/Projectile';
import { closestLineSegmentIntersectionWithLine, findWherePointIntersectLineSegmentAtRightAngle, LineSegment } from '../jmath/lineSegment';
import * as config from '../config';
import { add, equal, invert, Vec2 } from '../jmath/Vec';
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
    effect: async (state, card, quantity, underworld, prediction) => {
      let targets: Vec2[] = state.targetedUnits;
      targets = targets.length ? targets : [state.castLocation];
      let targetsHitCount = 0;
      let attackPromises = [];
      let timeoutToNextArrow = 200;
      for (let i = 0; i < quantity; i++) {
        for (let target of targets) {
          const arrowUnitCollisions = findArrowCollisions(state.casterPositionAtTimeOfCast, state.casterUnit.id, target, prediction, underworld);
          // This regular arrow spell doesn't pierce
          const firstTarget = arrowUnitCollisions[0];
          if (firstTarget) {
            playDefaultSpellSFX(card, prediction);
            if (!prediction && !globalThis.headless) {
              // Promise.race ensures arrow promise doesn't take more than X milliseconds so that multiple arrows cast
              // sequentially wont take too long to complete animating.
              // Note: I don't forsee any issues with the following spell (say if a spell was chained after arrow) executing
              // early
              const projectilePromise = createVisualFlyingProjectile(
                state.casterPositionAtTimeOfCast,
                firstTarget,
                'projectile/arrow',
              ).then(() => {
                if (Unit.isUnit(firstTarget)) {
                  Unit.takeDamage(firstTarget, damageDone, state.casterPositionAtTimeOfCast, underworld, prediction, undefined, { thinBloodLine: true });
                  targetsHitCount++;
                }
              });
              attackPromises.push(projectilePromise);
              const timeout = Math.max(0, timeoutToNextArrow);
              await Promise.race([new Promise(resolve => setTimeout(resolve, timeout)), projectilePromise]);
              // Decrease timeout with each subsequent arrow fired to ensure that players don't have to wait too long
              timeoutToNextArrow -= 5;
            } else {
              if (Unit.isUnit(firstTarget)) {
                Unit.takeDamage(firstTarget, damageDone, state.casterPositionAtTimeOfCast, underworld, prediction, undefined, { thinBloodLine: true });
                targetsHitCount++;
              }
            }
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
      return state;
    },
  }
};
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