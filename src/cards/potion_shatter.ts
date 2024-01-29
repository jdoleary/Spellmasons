import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { baseExplosionRadius } from '../effects/explode';

export const potionShatterId = 'Potion Shatter';
const baseEffectRadius = 50; //baseExplosionRadius / x?
const spell: Spell = {
  card: {
    id: potionShatterId,
    category: CardCategory.Blessings,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: '',
    sfx: '',
    description: ['spell_potion_shatter', baseEffectRadius.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target potions
      const targets = state.targetedPickups.filter(p => p.name.includes("potion"));
      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No valid targets. Cost refunded.');
        return state;
      }

      playDefaultSpellSFX(card, prediction);
      for (let potion of targets) {
        // Find all living units within radius of potion explosion
        const withinRadius =
          underworld.getUnitsWithinDistanceOfTarget(potion, baseEffectRadius * quantity, prediction)
            .filter(u => u.alive);

        // Apply the potion effect to all units within radius
        for (let unit of withinRadius) {
          potion.effect({ unit, player: undefined, pickup: potion, underworld, prediction });
        }
      }

      return state;
    },
  },
};
export default spell;
