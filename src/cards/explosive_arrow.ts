import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { arrowEffect } from './arrow';
import { arrow3CardId } from './arrow3';
import { explode } from '../effects/explode';
import { defaultPushDistance } from '../effects/force_move';

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
    // Arrows time depends on how far they have to fly
    timeoutMs: 1100,
    effect: arrowEffect(1, explosiveArrowCardId)
  },
  events: {
    onProjectileCollision: ({ unit, underworld, projectile, prediction }) => {
      if (unit) {
        Unit.takeDamage({
          unit: unit,
          amount: damageDone,
          sourceUnit: projectile.sourceUnit,
          fromVec2: projectile.startPoint,
          thinBloodLine: true,
        }, underworld, prediction);
        explode(unit, explodeRange, explodeDamage, defaultPushDistance,
          projectile.sourceUnit,
          underworld, prediction,
          colors.bloatExplodeStart, colors.bloatExplodeEnd);
      }
    }
  }
};
export default spell;