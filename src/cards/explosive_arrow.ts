import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { explode } from './bloat';
import { arrowEffect } from './arrow';
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
    effect: arrowEffect(1)
  },
  events: {
    onProjectileCollision: ({ unit, underworld, projectile, prediction }) => {
      if (unit) {
        Unit.takeDamage(unit, damageDone, projectile.startPoint, underworld, prediction, undefined, { thinBloodLine: true });
        explode(unit, explodeRange, explodeDamage, prediction, underworld);
      }
    }
  }
};
export default spell;