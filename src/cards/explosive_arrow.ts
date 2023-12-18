import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { EffectState, refundLastSpell, Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { forcePush, velocityStartMagnitude } from './push';
import * as math from '../jmath/math';
import { Vec2 } from '../jmath/Vec';
import { makeArrowEffect, ArrowProps, findArrowCollisions } from './arrow';
import { arrow3CardId } from './arrow3';
import Underworld from '../Underworld';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import { makeParticleExplosion } from '../graphics/ParticleCollection';

export const explosiveArrowCardId = 'Explosive Arrow';

const explodeDamage = 40;
const explodeRange = 140;
const arrowProps: ArrowProps = {
  damage: 10,
  pierce: 1,
  arrowCount: 1,
  onCollide: explode
}

const spell: Spell = {
  card: {
    id: explosiveArrowCardId,
    requires: [arrow3CardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 50,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconExplosiveArrow.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_explosive', arrowProps.damage.toString(), explodeDamage.toString()],
    effect: makeArrowEffect(arrowProps)
  }
};

async function explode(state: EffectState, unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  return new Promise<EffectState>((resolve) => {

    if (prediction) {
      drawUICirclePrediction(unit, explodeRange, colors.healthRed, 'Explosion Radius');
    } else {
      playSFXKey('bloatExplosion');
      makeParticleExplosion(unit, 1, prediction, "#dd4444", "#c0bbaf");
    }

    underworld.getUnitsWithinDistanceOfTarget(unit, explodeRange, prediction)
      .forEach(u => {
        // Deal damage to units
        Unit.takeDamage(u, explodeDamage, u, underworld, prediction);
        // Push units away from exploding location
        forcePush(u, unit, velocityStartMagnitude, underworld, prediction);
      });

    underworld.getPickupsWithinDistanceOfTarget(unit, explodeRange, prediction)
      .forEach(p => {
        // Push pickups away
        forcePush(p, unit, velocityStartMagnitude, underworld, prediction);
      })


    resolve(state);
  })
}

export default spell;