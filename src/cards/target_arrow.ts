import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import { CardCategory } from '../types/commonTypes';
import { addTarget, getCurrentTargets, refundLastSpell, Spell } from './index';
import * as math from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile, SPEED_PER_MILLI } from '../entity/Projectile';
import { findWherePointIntersectLineSegmentAtRightAngle } from '../jmath/lineSegment';
import * as config from '../config';
import { add, Vec2 } from '../jmath/Vec';

export const arrowCardId = 'Target Arrow';
const spell: Spell = {
  card: {
    id: arrowCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconArrowGreen.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    requiresFollowingCard: true,
    animationPath: '',
    sfx: '',
    description: `
Fires a targeting arrow.
The first entity that the arrow strikes becomes a target for the following spells.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let targets: Vec2[] = state.targetedUnits;
      targets = targets.length ? targets : [state.castLocation];
      for (let target of targets) {
        const flightPath = add(state.casterUnit, math.similarTriangles(target.x - state.casterUnit.x, target.y - state.casterUnit.y, math.distance(state.casterUnit, target), 1000));
        // Get all units between source and target for the arrow to pierce:
        const firstTarget = underworld.getPotentialTargets(prediction).find(
          (u) => {
            const pointAtRightAngleToArrowPath = findWherePointIntersectLineSegmentAtRightAngle(u, { p1: state.casterUnit, p2: flightPath });
            // Never target self
            if (Unit.isUnit(u) && u.id == state.casterUnit.id) {
              return false
            }
            const willBeStruckByArrow = !pointAtRightAngleToArrowPath ? false : math.distance(u, pointAtRightAngleToArrowPath) <= config.COLLISION_MESH_RADIUS * 2
            return willBeStruckByArrow;
          },
        );
        if (firstTarget) {
          // Prevent arrow from going through walls
          if (underworld.hasLineOfSight(state.casterUnit, firstTarget)) {
            if (prediction) {
              addTarget(firstTarget, state);
            } else {
              await createVisualFlyingProjectile(
                state.casterUnit,
                firstTarget,
                'projectile/arrow_ghost',
              ).then(() => {
                addTarget(firstTarget, state);
                // Animations do not occur on headless
                if (!globalThis.headless) {
                  return new Promise<void>((resolve) => {
                    if (globalThis.predictionGraphics) {
                      globalThis.predictionGraphics.clear();
                      globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0)
                      playSFXKey(`targetAquired0`);
                      globalThis.predictionGraphics.drawCircle(firstTarget.x, firstTarget.y, config.COLLISION_MESH_RADIUS);
                      // Show the targeting circle for a moment
                      setTimeout(resolve, 300);
                    } else {
                      resolve();
                    }
                  }).then(() => {
                    globalThis.predictionGraphics?.clear();
                  });
                }
                return;
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
