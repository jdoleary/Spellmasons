import { getCurrentTargets, refundLastSpell, Spell } from './index';
import { distance } from '../jmath/math';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { defaultPushDistance, forcePushAwayFrom, forcePushToDestination, forcePushTowards } from '../effects/force_move';
import { baseExplosionRadius, explode } from '../effects/explode';
import { Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';
import { IUnit, playAnimation, takeDamage } from '../entity/Unit';
import { makeParticleExplosion } from '../graphics/ParticleCollection';

export const stompCardId = 'stomp';
const stompMoveDistance = 100;
const stompRadius = 100;
const stompDamage = 20;
const spell: Spell = {
  card: {
    id: stompCardId,
    category: CardCategory.Movement,
    supportQuantity: true,
    allowNonUnitTarget: true,
    ignoreRange: true,
    sfx: 'stomp',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconStomp.png',
    description: 'spell_stomp',
    effect: async (state, card, quantity, underworld, prediction) => {
      const target = state.castLocation;

      if (target) {
        const moveDistance = Math.min(distance(state.casterUnit, target), stompMoveDistance * quantity)
        await forcePushTowards(state.casterUnit, target, moveDistance, underworld, prediction);

        const delayBetweenStomps = 300; //ms
        const radius = stompRadius * (1 + (0.25 * state.aggregator.radiusBoost));
        for (let i = 1; i <= quantity; i++) {
          if (!prediction && !globalThis.headless) {
            // Await some delay between stomps, with extra delay before the final stomp
            await new Promise(resolve => setTimeout(resolve, i == quantity ? delayBetweenStomps * 2 : delayBetweenStomps));
          }

          if (i < quantity) {
            // Early Stomp - does not push
            stompExplode(state.casterUnit, radius, stompDamage, 0,
              underworld, prediction,
              colors.trueGrey, colors.trueWhite);
          } else {
            // Final Stomp - Does pushback
            stompExplode(state.casterUnit, radius, stompDamage, stompRadius,
              underworld, prediction,
              colors.trueGrey, colors.trueWhite);
          }

          await underworld.awaitForceMoves();
        }
      }

      return state;
    },
  },
};

// Copied from explode.ts and modified slightly to
// not damage caster, and not draw more prediction circles
async function stompExplode(caster: IUnit, radius: number, damage: number, pushDistance: number, underworld: Underworld, prediction: boolean, colorstart?: number, colorEnd?: number) {
  if (prediction) {
    drawUICirclePrediction(caster, radius, colors.errorRed, 'Stomp Radius');
  } else {
    playSFXKey('bloatExplosion');
    if (colorstart && colorEnd) {
      makeParticleExplosion(caster, radius / baseExplosionRadius, colorstart, colorEnd, prediction);
    }
  }

  const units = underworld.getUnitsWithinDistanceOfTarget(caster, radius, prediction).filter(u => u.id != caster.id);

  if (damage != 0) {
    units.forEach(u => {
      // Deal damage to units
      takeDamage(u, damage, u, underworld, prediction);
    });
  }

  if (pushDistance > 0) {
    units.forEach(u => {
      // Push units away from exploding location
      forcePushAwayFrom(u, caster, pushDistance, underworld, prediction);
    })

    underworld.getPickupsWithinDistanceOfTarget(caster, radius, prediction)
      .forEach(p => {
        // Push pickups away
        forcePushAwayFrom(p, caster, pushDistance, underworld, prediction);
      })
  }

  return units;
}

export default spell;
