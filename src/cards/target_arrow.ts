import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import { CardCategory } from '../types/commonTypes';
import { addTarget, refundLastSpell, Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile } from '../entity/Projectile';
import * as config from '../config';
import { Vec2 } from '../jmath/Vec';
import { findArrowUnitCollisions } from './arrow';

export const targetArrowCardId = 'Target Arrow';
const spell: Spell = {
  card: {
    id: targetArrowCardId,
    category: CardCategory.Targeting,
    supportQuantity: false,
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
    description: 'spell_target_arrow',
    effect: async (state, card, quantity, underworld, prediction) => {
      let targets: Vec2[] = state.targetedUnits;
      targets = targets.length ? targets : [state.castLocation];
      const promises = [];
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        const arrowUnitCollisions = findArrowUnitCollisions(state.casterUnit, target, prediction, underworld);
        // This target arrow spell doesn't pierce
        const firstTarget = arrowUnitCollisions[0];
        if (firstTarget) {
          if (prediction) {
            if (Unit.isUnit(firstTarget)) {
              addTarget(firstTarget, state);
            }
          } else {
            promises.push(createVisualFlyingProjectile(
              state.casterUnit,
              firstTarget,
              'projectile/arrow_ghost',
            ).then(() => {
              if (Unit.isUnit(firstTarget)) {
                addTarget(firstTarget, state);
                // Animations do not occur on headless
                if (!globalThis.headless) {
                  return new Promise<void>((resolve) => {
                    if (globalThis.predictionGraphics) {
                      globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0)
                      playSFXKey(`targetAquired0`);
                      globalThis.predictionGraphics.drawCircle(firstTarget.x, firstTarget.y, config.COLLISION_MESH_RADIUS);
                      // Show the targeting circle for a moment
                      setTimeout(resolve, 300);
                    } else {
                      resolve();
                    }
                  })
                }
              }
              return;
            }));
          }
        } else {
          refundLastSpell(state, prediction, 'No target, mana refunded.')
        }
      }
      await Promise.all(promises).then(() => {
        globalThis.predictionGraphics?.clear();
      });
      return state;
    },
  }
};
export default spell;
