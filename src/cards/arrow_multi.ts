import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { arrowTripleCardId } from './arrow_triple';
import { arrowEffect } from './arrow';
import { takeDamage } from '../entity/Unit';

export const arrowMultiCardId = 'Multi Arrow';
const damageDone = 10;
const arrowCount = 5;
const spell: Spell = {
  card: {
    id: arrowMultiCardId,
    replaces: [arrowTripleCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconArrowMulti.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    ignoreRange: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_many', arrowCount.toString(), damageDone.toString()],
    effect: arrowEffect(arrowCount, arrowMultiCardId)
  },
  events: {
    onProjectileCollision: ({ unit, underworld, projectile, prediction }) => {
      if (unit) {
        takeDamage({
          unit: unit,
          amount: damageDone,
          sourceUnit: projectile.sourceUnit,
          fromVec2: projectile.startPoint,
          thinBloodLine: true,
        }, underworld, prediction);
      }
    }
  }
};
export default spell;