import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { baseExplosionRadius, explode } from '../effects/explode';
import { HEALTH_POTION, IPickup, MANA_POTION, STAMINA_POTION, removePickup } from '../entity/Pickup';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import * as colors from '../graphics/ui/colors';
import { COLLISION_MESH_RADIUS } from '../config';
import { makeParticleExplosion } from '../graphics/ParticleCollection';
import { includes } from 'lodash';

export const potionShatterId = 'Potion Shatter';
const baseEffectRadius = 80; //baseExplosionRadius / x?
const spell: Spell = {
  card: {
    id: potionShatterId,
    category: CardCategory.Blessings,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconPotionBreak.png',
    sfx: 'bloatExplosion',
    description: ['spell_potion_shatter', baseEffectRadius.toString()],
    timeoutMs: 920,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target potions
      const targets = state.targetedPickups.filter(p => p.name.includes("Potion"));
      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No valid targets. Cost refunded.');
        return state;
      }

      // +50% radius per radius boost
      const adjustedRadiusBoost = quantity - 1 + state.aggregator.radiusBoost;
      const adjustedRadius = baseEffectRadius * (1 + (0.5 * adjustedRadiusBoost));
      playDefaultSpellSFX(card, prediction);
      for (let potion of targets) {
        if (potion.flaggedForRemoval) continue;

        if (prediction) {
          drawUICirclePrediction(potion, adjustedRadius, colors.healthRed, 'Explosion Radius');
        } else {
          // Create explosion using the potion color
          const colorStart = getColorFromPotion(potion);
          makeParticleExplosion(potion, adjustedRadius / baseExplosionRadius, colorStart, colorStart, prediction);
        }

        // Find all living units within radius of potion explosion
        const withinRadius =
          underworld.getUnitsWithinDistanceOfTarget(potion, adjustedRadius, prediction)
            .filter(u => u.alive);

        // Apply the potion effect to all units within radius
        for (let unit of withinRadius) {
          potion.effect({ unit, player: undefined, pickup: potion, underworld, prediction });
        }

        removePickup(potion, underworld, prediction);
      }

      return state;
    },
  },
};

function getColorFromPotion(potion: IPickup): number {
  switch (potion.name) {
    case HEALTH_POTION:
      return colors.healthRed;
    case MANA_POTION:
      return colors.manaBlue;
    case STAMINA_POTION:
      return colors.stamina;
  }

  return colors.errorRed;
}

export default spell;