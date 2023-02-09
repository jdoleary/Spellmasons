import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { refundLastSpell, Spell } from './index';
import * as math from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile, SPEED_PER_MILLI } from '../entity/Projectile';
import { Vec2 } from '../jmath/Vec';
import { findArrowPath, findArrowCollisions } from './arrow';
import { playDefaultSpellSFX } from './cardUtils';

export const phantomArrowCardId = 'Phantom Arrow';
const damageDone = 30;
const spell: Spell = {
  card: {
    id: phantomArrowCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconArrowRed.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'phantomArrow',
    description: ['spell_phantom_arrow', damageDone.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      let targets: Vec2[] = state.targetedUnits;
      targets = targets.length ? targets : [state.castLocation];
      let targetsHitCount = 0;
      let attackPromises = [];
      let timeoutToNextArrow = 200;
      for (let i = 0; i < quantity; i++) {
        for (let target of targets) {
          const arrowCollisions = findArrowCollisions(state.casterPositionAtTimeOfCast, state.casterUnit.id, target, prediction, underworld);
          const arrowShootPath = findArrowPath(state.casterPositionAtTimeOfCast, target, underworld);
          if (arrowShootPath === undefined) {
            continue;
          }
          if (!prediction && !globalThis.headless) {
            playDefaultSpellSFX(card, prediction);
            const projectilePromise = createVisualFlyingProjectile(
              arrowShootPath.p1,
              arrowShootPath.p2,
              'projectile/arrow',
            )
            // Promise.race ensures arrow promise doesn't take more than X milliseconds so that multiple arrows cast
            // sequentially wont take too long to complete animating.
            // Note: I don't forsee any issues with the following spell (say if a spell was chained after arrow) executing
            // early
            const timeout = Math.max(0, timeoutToNextArrow);
            attackPromises.push(projectilePromise);
            arrowCollisions.forEach(pierceTarget => {
              // Fake the collision by just calculating a delay based on the speed of the projectile
              const millisecondsUntilCollision = math.distance(arrowShootPath.p1, pierceTarget) / SPEED_PER_MILLI
              setTimeout(() => {
                if (Unit.isUnit(pierceTarget)) {
                  Unit.takeDamage(pierceTarget, damageDone, arrowShootPath.p1, underworld, false, undefined, { thinBloodLine: true });
                }
              }, millisecondsUntilCollision);
            });
            await Promise.race([new Promise(resolve => setTimeout(resolve, timeout)), projectilePromise]);
            // Decrease timeout with each subsequent arrow fired to ensure that players don't have to wait too long
            timeoutToNextArrow -= 5;
            targetsHitCount += arrowCollisions.filter(x => Unit.isUnit(x)).length;
          } else {
            for (let u of arrowCollisions) {
              if (Unit.isUnit(u)) {
                Unit.takeDamage(u, damageDone, state.casterPositionAtTimeOfCast, underworld, prediction, undefined, { thinBloodLine: true });
                targetsHitCount++;
              }
            }
          }
        }
      }
      await Promise.all(attackPromises).then(() => {
        if (targetsHitCount == 0) {
          refundLastSpell(state, prediction, 'No target, mana refunded.')
        }
      });
      return state;
    },
  }
};
export default spell;