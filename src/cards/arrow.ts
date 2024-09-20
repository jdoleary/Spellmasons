import * as Unit from '../entity/Unit';
import type { HasSpace } from '../entity/Type';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import { EffectState, ICard, refundLastSpell, Spell } from './index';
import * as math from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile } from '../entity/Projectile';
import { closestLineSegmentIntersectionWithLine, findWherePointIntersectLineSegmentAtRightAngle, LineSegment } from '../jmath/lineSegment';
import * as config from '../config';
import { add, equal, getAngleBetweenVec2s, getEndpointOfMagnitudeAlongVector, invert, subtract, Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import { makeForceMoveProjectile, moveAlongVector, normalizedVector } from '../jmath/moveWithCollision';
import { addPixiSpriteAnimated, containerProjectiles } from '../graphics/PixiUtils';

export const arrowCardId = 'Arrow';
const damage = 10;
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
    ignoreRange: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow', damage.toString()],
    effect: arrowEffect(1, arrowCardId)
  },
  events: {
    onProjectileCollision: ({ unit, underworld, projectile, prediction }) => {
      if (unit) {
        Unit.takeDamage({
          unit: unit,
          amount: damage,
          sourceUnit: projectile.sourceUnit,
          fromVec2: projectile.startPoint,
          thinBloodLine: true,
        }, underworld, prediction);
      }
    }
  }
};
export function arrowEffect(multiShotCount: number, collideFnKey: string, piercesRemaining: number = 0, bouncesRemaining: number = 0) {
  return async (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean) => {
    let targets: Vec2[] = state.targetedUnits;
    targets = targets.length ? targets : [state.castLocation];
    let timeoutToNextArrow = 200;
    for (let i = 0; i < quantity; i++) {
      for (let target of targets) {
        for (let arrowNumber = 0; arrowNumber < multiShotCount; arrowNumber++) {
          // START: Shoot multiple arrows at offset
          let casterPositionAtTimeOfCast = state.casterPositionAtTimeOfCast;
          let castLocation = target;
          if (arrowNumber > 0) {
            const diff = subtract(casterPositionAtTimeOfCast, getEndpointOfMagnitudeAlongVector(casterPositionAtTimeOfCast, (arrowNumber % 2 == 0 ? -1 : 1) * Math.PI / 2 + getAngleBetweenVec2s(state.casterPositionAtTimeOfCast, state.castLocation), arrowNumber > 2 ? 40 : 20));
            casterPositionAtTimeOfCast = subtract(casterPositionAtTimeOfCast, diff);
            castLocation = subtract(castLocation, diff);
          }
          // END: Shoot multiple arrows at offset
          const startPoint = casterPositionAtTimeOfCast;
          const velocity = math.similarTriangles(target.x - startPoint.x, target.y - casterPositionAtTimeOfCast.y, math.distance(startPoint, target), config.ARROW_PROJECTILE_SPEED)
          let image: Image.IImageAnimated | undefined;
          if (!prediction) {
            image = Image.create(casterPositionAtTimeOfCast, 'arrow', containerProjectiles)
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
            piercesRemaining: piercesRemaining + state.aggregator.additionalPierce,
            bouncesRemaining: bouncesRemaining + state.aggregator.additionalBounce,
            collidingUnitIds: [state.casterUnit.id],
            collideFnKey,
            state,
          }, underworld, prediction);

          if (!prediction && !globalThis.headless) {
            const timeout = Math.max(0, timeoutToNextArrow);
            await new Promise(resolve => setTimeout(resolve, timeout));
            // Decrease timeout with each subsequent arrow fired to ensure that players don't have to wait too long
            timeoutToNextArrow -= 5;
          }
        }
      }

    }
    await underworld.awaitForceMoves();
    return state;
  }
}
export default spell;