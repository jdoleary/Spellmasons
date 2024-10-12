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

export const targetDiskCardId = 'Target Disk'
let targetsToAdd: Vec2[] = [];
const spell: Spell = {
  card: {
    id: targetDiskCardId,
    category: CardCategory.Targeting,
    probability: probabilityMap[CardRarity.UNCOMMON],
    requires: [targetArrowCardId],
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
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
    thumbnail: 'spellIconTargetDisk.png',
    description: 'spell_target_ricochet_arrow',
    effect: async (state, card, quantity, underworld, prediction) => {
      const initialCastLocation = state.castLocation;
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
          image = Image.create(casterPositionAtTimeOfCast, 'targetDisk', containerProjectiles)
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
          beingPushed: false,
          debugName: 'target disk'
        }
        makeForceMoveProjectile({
          sourceUnit: state.casterUnit,
          pushedObject,
          startPoint,
          velocity,
          piercesRemaining: state.aggregator.additionalPierce,
          bouncesRemaining: quantity + state.aggregator.additionalBounce,
          collidingUnitIds: [state.casterUnit.id],
          collideFnKey: targetDiskCardId,
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
      // To allow combos like [Target Arrow + Teleport], we set castLocation at wall collision
      // but we should only do this if no other targets (units or pickups) are added.
      // This ensures combos like [Ricochet Arrow + Target Cone] behave predictably
      state.castLocation = targets.length ? initialCastLocation : state.castLocation;

      if (!prediction && !globalThis.headless && globalThis.predictionGraphics) {
        // Await long enough to show targeting circles
        await new Promise(res => {
          setTimeout(res, 300);
        })
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
          // There is no support for adding multiple vector locations as targets
          projectile.state.castLocation = projectile.pushedObject;
        }
      } else {
        console.error("State was not passed through projectile");
      }
    }
  }
};
export default spell;