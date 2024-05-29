import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { EffectState, Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getAngleBetweenVec2s, getEndpointOfMagnitudeAlongVector } from '../jmath/Vec';
import Underworld from '../Underworld';
import regularArrow, { arrowCardId, arrowEffect } from './arrow';
import { raceTimeout } from '../Promise';
import { arrowTripleCardId } from './arrow_triple';

export const arrowForkCardId = 'Shatter Arrow';
const damageMult = 1.5;
const spell: Spell = {
  card: {
    id: arrowForkCardId,
    requires: [arrowTripleCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconArrowFork.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    ignoreRange: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_fork', Unit.GetSpellDamage(undefined, damageMult).toString()],
    effect: arrowEffect(1, arrowForkCardId)
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

        // Now fork into regular arrows that fire in directions
        for (let newAngle of [Math.PI / 12, -Math.PI / 12, 2 * Math.PI / 12, -2 * Math.PI / 12, 3 * Math.PI / 12, -3 * Math.PI / 12]) {
          const angle = getAngleBetweenVec2s(projectile.startPoint, unit) + newAngle;
          const castLocation = getEndpointOfMagnitudeAlongVector(unit, angle, 10_000);
          arrowEffect(1, arrowCardId)({ cardIds: [regularArrow.card.id], shouldRefundLastSpell: false, casterPositionAtTimeOfCast: unit, targetedUnits: [], targetedPickups: [], casterUnit: unit, castLocation, aggregator: { radiusBoost: 0 }, initialTargetedPickupId: undefined, initialTargetedUnitId: undefined }, regularArrow.card, 1, underworld, prediction, false);
        }
      }
    }
  }
};
export default spell;