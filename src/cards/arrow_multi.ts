import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { arrowTripleCardId } from './arrow_triple';
import { arrowEffect } from './arrow';
import { GetSpellDamage, takeDamage } from '../entity/Unit';

export const arrowMultiCardId = 'Multi Arrow';
const damageMult = 0.5;
const arrowCount = 5;
const spell: Spell = {
  card: {
    id: arrowMultiCardId,
    replaces: [arrowTripleCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconArrowMulti.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    ignoreRange: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_many', arrowCount.toString(), GetSpellDamage(undefined, damageMult).toString()],
    effect: arrowEffect(arrowCount, arrowMultiCardId)
  },
  events: {
    onProjectileCollision: ({ unit, underworld, projectile, prediction }) => {
      if (unit) {
        if (projectile.sourceUnit) {
          takeDamage({
            unit: unit,
            amount: GetSpellDamage(projectile.sourceUnit.damage, damageMult),
            sourceUnit: projectile.sourceUnit,
            fromVec2: projectile.startPoint,
            thinBloodLine: true,
          }, underworld, prediction);
        } else {
          console.error("No source unit for projectile: ", projectile);
        }
      }
    }
  }
};
export default spell;