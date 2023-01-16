import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { refundLastSpell, Spell } from './index';
import * as math from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile, SPEED_PER_MILLI } from '../entity/Projectile';
import { Vec2 } from '../jmath/Vec';
import { findArrowPath, findArrowCollisions } from './arrow';

export const phantomArrowCardId = 'Phantom Arrow';
const damageDone = 30;
const spell: Spell = {
  card: {
    id: phantomArrowCardId,
    category: CardCategory.Damage,
    supportQuantity: false,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconArrowRed.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: '',
    description: ['spell_phantom_arrow', damageDone.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      let targets: Vec2[] = state.targetedUnits;
      targets = targets.length ? targets : [state.castLocation];
      let promises = [];
      for (let target of targets) {
        const arrowCollisions = findArrowCollisions(state.casterUnit, target, prediction, underworld);
        const arrowShootPath = findArrowPath(state.casterUnit, target, underworld);
        if (!prediction) {
          promises.push(createVisualFlyingProjectile(
            arrowShootPath.p1,
            arrowShootPath.p2,
            'projectile/arrow',
          ));
          arrowCollisions.forEach(pierceTarget => {
            // Fake the collision by just calculating a delay based on the speed of the projectile
            const millisecondsUntilCollision = math.distance(arrowShootPath.p1, pierceTarget) / SPEED_PER_MILLI
            setTimeout(() => {
              if (Unit.isUnit(pierceTarget)) {
                Unit.takeDamage(pierceTarget, damageDone, arrowShootPath.p1, underworld, false, undefined, { thinBloodLine: true });
              }
            }, millisecondsUntilCollision);
          });
          if (arrowCollisions.filter(x => Unit.isUnit(x)).length == 0) {
            // TODO: If pickups become damagable, this will have to be adapted to not refund mana when it hits a pickup
            refundLastSpell(state, prediction, 'No target, mana refunded.')
          }
        } else {
          for (let u of arrowCollisions) {
            if (Unit.isUnit(u)) {
              Unit.takeDamage(u, damageDone, state.casterUnit, underworld, prediction, undefined, { thinBloodLine: true });
            }
          }
        }
      }
      await Promise.all(promises);
      return state;
    },
  }
};
export default spell;