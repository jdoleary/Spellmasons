import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { arrowEffect } from './arrow';
import { arrow2CardId } from './arrow2';
import { takeDamage } from '../entity/Unit';

export const arrow3CardId = 'Arrow3';
const damageDone = 30;
const spell: Spell = {
  card: {
    id: arrow3CardId,
    replaces: [arrow2CardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 22,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconArrow3.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    ignoreRange: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow', damageDone.toString()],
    effect: arrowEffect(1, arrow3CardId),
  },
  events: {
    onProjectileCollision: ({ unit, underworld, projectile, prediction }) => {
      if (unit) {
        takeDamage({
          source: undefined, // TODO - CASTER
          unit: unit,
          amount: damageDone,
          fromVec2: projectile.startPoint,
          thinBloodLine: true,
        }, underworld, prediction);
      }
    }
  }
};
export default spell;