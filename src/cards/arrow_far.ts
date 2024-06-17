import * as Unit from '../entity/Unit';
import { Spell } from './index';
import { CardCategory, CardRarity, probabilityMap } from '../types/commonTypes';
import * as math from '../jmath/math';
import { Vec2 } from '../jmath/Vec';
import { arrowEffect } from './arrow';
import { arrow2CardId } from './arrow2';

export const arrowFarCardId = 'Long Arrow';
const maxDamageMult = 2.5;
const minRange = 100;
const maxDamageRange = 600;
function calculateDamage(casterDamage: number, distance: number): number {
  // Damage scales linearly with distance
  // - Min Range = 0 Damage
  // - Max range = Max damage
  const damageRatio = Math.max(0, distance - minRange) / maxDamageRange;
  const maxDamage = Unit.GetSpellDamage(casterDamage, maxDamageMult);
  return Math.ceil(math.lerp(0, maxDamage, damageRatio));
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
    ignoreRange: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_far', Unit.GetSpellDamage(undefined, maxDamageMult).toString()],
    effect: arrowEffect(1, arrowFarCardId),
  },
  events: {
    onProjectileCollision: ({ unit, underworld, projectile, prediction }) => {
      if (unit) {
        if (projectile.sourceUnit) {
          const dist = math.distance(projectile.startPoint, unit);
          Unit.takeDamage({
            unit: unit,
            amount: calculateDamage(projectile.sourceUnit.damage, dist),
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