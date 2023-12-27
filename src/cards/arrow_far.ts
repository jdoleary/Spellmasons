import * as Unit from '../entity/Unit';
import { Spell } from './index';
import { CardCategory, CardRarity, probabilityMap } from '../types/commonTypes';
import * as math from '../jmath/math';
import { Vec2 } from '../jmath/Vec';
import { arrowEffect } from './arrow';
import { arrow2CardId } from './arrow2';

export const arrowFarCardId = 'Long Arrow';
const maxDamage = 50;
const minRange = 100;
const maxDamageRange = 600;
function calculateDamage(casterPositionAtTimeOfCast: Vec2, target: Vec2): number {
  const dist = math.distance(casterPositionAtTimeOfCast, target)
  return Math.ceil(math.lerp(0, maxDamage, Math.max(0, dist - minRange) / maxDamageRange));
}

const spell: Spell = {
  card: {
    id: arrowFarCardId,
    requires: [arrow2CardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconArrowLong.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_far', maxDamage.toString()],
    effect: arrowEffect(1),
  },
  events: {
    onProjectileCollision: ({ unit, underworld, projectile, prediction }) => {
      if (unit) {
        Unit.takeDamage(unit, calculateDamage(projectile.startPoint, unit), projectile.startPoint, underworld, prediction, undefined, { thinBloodLine: true });
      }
    }
  }
};



export default spell;