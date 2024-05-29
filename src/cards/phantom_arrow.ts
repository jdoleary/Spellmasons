import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { arrowEffect } from './arrow';

export const phantomArrowCardId = 'Phantom Arrow';
const damageMult = 1.5;
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
    ignoreRange: true,
    animationPath: '',
    sfx: 'phantomArrow',
    description: ['spell_phantom_arrow', Unit.GetSpellDamage(undefined, damageMult).toString()],
    effect: arrowEffect(1, phantomArrowCardId, true)
  },
  events: {
    onProjectileCollision: ({ unit, underworld, projectile, prediction }) => {
      if (unit) {
        if (projectile.sourceUnit) {
          Unit.takeDamage({
            unit: unit,
            amount: Unit.GetSpellDamage(projectile.sourceUnit.damage, damageMult),
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