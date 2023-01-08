import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { getCurrentTargets, refundLastSpell, Spell } from './index';
import * as math from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile, SPEED_PER_MILLI } from '../entity/Projectile';
import { findWherePointIntersectLineSegmentAtRightAngle } from '../jmath/lineSegment';
import * as config from '../config';
import { add, Vec2 } from '../jmath/Vec';

export const arrowCardId = 'Arrow';
const damageDone = 2;
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
    sfx: '',
    description: `
Fires an arrow that deals ${damageDone} damage to the first unit that it strikes.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let targets: Vec2[] = state.targetedUnits;
      targets = targets.length ? targets : [state.castLocation];
      for (let target of targets) {
        // Get all units between source and target for the arrow to pierce:
        const firstTarget = (prediction ? underworld.unitsPrediction : underworld.units).find(
          (u) => {
            const flightPath = add(state.casterUnit, math.similarTriangles(target.x - state.casterUnit.x, target.y - state.casterUnit.y, math.distance(state.casterUnit, target), 1000));
            const pointAtRightAngleToArrowPath = findWherePointIntersectLineSegmentAtRightAngle(u, { p1: state.casterUnit, p2: flightPath });
            const willBeStruckByArrow = !pointAtRightAngleToArrowPath ? false : math.distance(u, pointAtRightAngleToArrowPath) <= config.COLLISION_MESH_RADIUS * 2
            // Note: Filter out self as the arrow shouldn't damage caster
            return u.alive && willBeStruckByArrow && u.id !== state.casterUnit.id;
          },
        );
        if (firstTarget) {
          // Prevent arrow from going through walls
          if (underworld.hasLineOfSight(state.casterUnit, firstTarget)) {
            if (prediction) {
              Unit.takeDamage(firstTarget, damageDone, state.casterUnit, underworld, prediction, undefined, { thinBloodLine: true });
            } else {
              await createVisualFlyingProjectile(
                state.casterUnit,
                firstTarget,
                'projectile/arrow',
              ).then(() => {
                Unit.takeDamage(firstTarget, damageDone, state.casterUnit, underworld, prediction, undefined, { thinBloodLine: true });
              });
            }
          } else {
            refundLastSpell(state, prediction, 'No target, mana refunded.')
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
