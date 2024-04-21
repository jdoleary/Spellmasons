import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { HEALTH_POTION, IPickup, MANA_POTION, STAMINA_POTION, removePickup } from '../entity/Pickup';
import * as Pickup from '../entity/Pickup';
import { makeAlchemizeParticles } from '../graphics/ParticleCollection';

export const alchemizeId = 'Alchemize';
const spell: Spell = {
  card: {
    id: alchemizeId,
    category: CardCategory.Blessings,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconAlchemize.png',
    sfx: 'heal',
    description: ['spell_alchemize'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target potions
      const targets = state.targetedPickups.filter(p => p.name.includes("Potion"));
      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No valid targets. Cost refunded.');
        return state;
      }


      playDefaultSpellSFX(card, prediction);
      for (let potion of targets) {
        if (potion.flaggedForRemoval) continue;
        makeAlchemizeParticles(potion, prediction);

        const next = getNextPotion(potion, quantity);
        if (next) {
          const index = Pickup.pickups.findIndex(p => p.name == next);
          underworld.spawnPickup(index, { x: potion.x, y: potion.y }, prediction);
          removePickup(potion, underworld, prediction);
        }
      }

      return state;
    },
  },
};

function getNextPotion(potion: IPickup, quantity: number): string | undefined {
  // Deterministically cycle to the next pickup,
  // moving one index forward for each quantity
  const pickups = [STAMINA_POTION, HEALTH_POTION, MANA_POTION];

  let index = pickups.findIndex(p => p == potion.name);
  if (index != -1) {
    index = (index + quantity) % pickups.length;
    return pickups[index];
  }

  console.log("No alchemize entry for: ", potion);
  return undefined;
}

export default spell;