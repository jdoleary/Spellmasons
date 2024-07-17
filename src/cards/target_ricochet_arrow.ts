import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import * as colors from '../graphics/ui/colors';
import * as math from '../jmath/math';
import * as config from '../config';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { addTarget, getCurrentTargets, refundLastSpell, Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { clone, Vec2 } from '../jmath/Vec';
import { makeForceMoveProjectile } from '../jmath/moveWithCollision';
import { HasSpace } from '../entity/Type';
import { containerProjectiles } from '../graphics/PixiUtils';
import { targetArrowCardId } from './target_arrow';

export const targetRicochetArrowCardId = 'Target Ricochet Arrow';
let targetsToAdd: Vec2[] = [];
const spell: Spell = {
  card: {
    id: targetRicochetArrowCardId,
    category: CardCategory.Targeting,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    requires: [targetArrowCardId],
    thumbnail: 'spellIconArrowGreen.png',
    supportQuantity: true,
    ignoreRange: true,
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    // This ensures that "target scamming" doesn't work with target arrow
    // due to it being able to fire out of range
    noInitialTarget: true,
    requiresFollowingCard: true,
    animationPath: '',
    sfx: '',
    description: 'spell_target_ricochet_arrow',
    effect: async (state, card, quantity, underworld, prediction) => {
      // - - - - - Start copied from arrow.ts - - - - -
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      let timeoutToNextArrow = 200;
      for (let target of targets) {
        let casterPositionAtTimeOfCast = state.casterPositionAtTimeOfCast;

        const startPoint = casterPositionAtTimeOfCast;
        const velocity = math.similarTriangles(target.x - startPoint.x, target.y - casterPositionAtTimeOfCast.y, math.distance(startPoint, target), config.ARROW_PROJECTILE_SPEED)
        let image: Image.IImageAnimated | undefined;
        if (!prediction) {
          image = Image.create(casterPositionAtTimeOfCast, 'projectile/arrow', containerProjectiles)
          if (image) {
            image.sprite.rotation = Math.atan2(velocity.y, velocity.x);
          }
        }
        const pushedObject: HasSpace = {
          x: casterPositionAtTimeOfCast.x,
          y: casterPositionAtTimeOfCast.y,
          radius: 1,
          inLiquid: false,
          image,
          immovable: false,
          beingPushed: false
        }
        makeForceMoveProjectile({
          sourceUnit: state.casterUnit,
          pushedObject,
          startPoint,
          velocity,
          piercesRemaining: 0,
          bouncesRemaining: quantity - 1,
          ignoreUnitIds: [state.casterUnit.id],
          collideFnKey: targetRicochetArrowCardId,
          state,
        }, underworld, prediction);

        if (!prediction && !globalThis.headless) {
          const timeout = Math.max(0, timeoutToNextArrow);
          await new Promise(resolve => setTimeout(resolve, timeout));
          // Decrease timeout with each subsequent arrow fired to ensure that players don't have to wait too long
          timeoutToNextArrow -= 5;
        }
      }

      await underworld.awaitForceMoves();
      // - - - - - End copied from arrow.ts - - - - -

      // Update targets variable to include newly added targets
      targets = getCurrentTargets(state);
      if (!prediction && !globalThis.headless && globalThis.predictionGraphics) {
        const promises: Promise<void>[] = [];
        targets.forEach(t => {
          // Animations do not occur on headless
          promises.push(new Promise<void>((resolve) => {
            if (globalThis.predictionGraphics) {
              globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0)
              playSFXKey('targetAquired');
              globalThis.predictionGraphics.drawCircle(t.x, t.y, config.COLLISION_MESH_RADIUS);
              // Show the targeting circle for a moment
              setTimeout(resolve, 300);
            }
          }));
        });
        await Promise.all(promises);
        globalThis.predictionGraphics.clear();
      }
      return state;
    },
  },
  events: {
    onProjectileCollision: ({ unit, pickup, underworld, projectile, prediction }) => {
      if (projectile.state) {
        if (unit) {
          addTarget(unit, projectile.state, underworld, prediction);
        } else if (pickup) {
          addTarget(pickup, projectile.state, underworld, prediction);
        } else {
          // Add collision location as target
          //addTarget(projectile.pushedObject, projectile.state, underworld, prediction);
        }
      } else {
        console.error("State was not passed through projectile");
      }
    }
  }
};
export default spell;