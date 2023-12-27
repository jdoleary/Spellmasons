import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { refundLastSpell, Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile } from '../entity/Projectile';
import { Vec2 } from '../jmath/Vec';
import { playDefaultSpellSFX } from './cardUtils';
import { explode } from './bloat';
import { findArrowCollisions } from './arrow';
import { arrow3CardId } from './arrow3';

export const explosiveArrowCardId = 'Explosive Arrow';
const damageDone = 10;
const explodeRange = 140;
const explodeDamage = 40;
const spell: Spell = {
  card: {
    id: explosiveArrowCardId,
    requires: [arrow3CardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconExplosiveArrow.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    ignoreRange: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_explosive', damageDone.toString(), explodeDamage.toString()],
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
                  explode(firstTarget, explodeRange, explodeDamage, prediction, underworld);
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
                explode(firstTarget, explodeRange, explodeDamage, prediction, underworld);
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