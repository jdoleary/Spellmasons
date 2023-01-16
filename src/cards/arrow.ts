import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { refundLastSpell, Spell } from './index';
import * as math from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile } from '../entity/Projectile';
import { closestLineSegmentIntersectionWithLine, findWherePointIntersectLineSegmentAtRightAngle, LineSegment } from '../jmath/lineSegment';
import * as config from '../config';
import { add, Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';

export const arrowCardId = 'Arrow';
const damageDone = 10;
const spell: Spell = {
  card: {
    id: arrowCardId,
    category: CardCategory.Damage,
    supportQuantity: false,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconArrow.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: '',
    description: ['spell_arrow', damageDone.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      let targets: Vec2[] = state.targetedUnits;
      targets = targets.length ? targets : [state.castLocation];
      for (let target of targets) {
        const arrowUnitCollisions = findArrowCollisions(state.casterUnit, target, prediction, underworld);
        // This regular arrow spell doesn't pierce
        const firstTarget = arrowUnitCollisions[0];
        if (firstTarget) {
          if (!prediction) {
            await createVisualFlyingProjectile(
              state.casterUnit,
              firstTarget,
              'projectile/arrow',
            ).then(() => {
              if (Unit.isUnit(firstTarget)) {
                Unit.takeDamage(firstTarget, damageDone, state.casterUnit, underworld, prediction, undefined, { thinBloodLine: true });
              } else {
                // TODO: If pickups become damagable, this will have to be adapted to not refund mana when it hits a pickup
                refundLastSpell(state, prediction, 'No target, mana refunded.')
              }
            });
          } else {
            if (Unit.isUnit(firstTarget)) {
              Unit.takeDamage(firstTarget, damageDone, state.casterUnit, underworld, prediction, undefined, { thinBloodLine: true });
            }
          }
        } else {
          refundLastSpell(state, prediction, 'No target, mana refunded.')
        }
      }
      return state;
    },
  }
};
export default spell;
// Returns the start and end point that an arrow will take until it hits a wall
export function findArrowPath(casterUnit: Unit.IUnit, target: Vec2, underworld: Underworld): LineSegment {
  // Find a point that the arrow is shooting towards that is sure to be farther than the farthest wall
  let endPoint = add(casterUnit, math.similarTriangles(target.x - casterUnit.x, target.y - casterUnit.y, math.distance(casterUnit, target), 10000));
  let arrowShootPath = { p1: casterUnit, p2: endPoint };
  // revise end point to stop where it hits the first wall
  const LOSResult = closestLineSegmentIntersectionWithLine(arrowShootPath, underworld.walls);
  const intersection = LOSResult ? LOSResult.intersection : undefined;
  if (intersection) {
    endPoint = intersection;
    // revise arrow shoot path now that endpoint has changed
    return { p1: casterUnit, p2: endPoint };
  } else {
    console.error('Unexpected: arrow couldnt find wall to intersect with');
    return { p1: casterUnit, p2: target };
  }

}

export function findArrowCollisions(casterUnit: Unit.IUnit, target: Vec2, prediction: boolean, underworld: Underworld): Vec2[] {
  const arrowShootPath = findArrowPath(casterUnit, target, underworld);
  // Get all units between source and target for the arrow to pierce:
  const hitTargets = (prediction ? underworld.unitsPrediction : underworld.units).filter(
    (u) => {
      if (!u.alive) {
        return false;
      }
      // Note: Filter out self as the arrow shouldn't damage caster
      if (u.id == casterUnit.id) {
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