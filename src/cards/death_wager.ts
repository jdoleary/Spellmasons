import { Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import floatingText from '../graphics/FloatingText';

const id = 'Death Wager';
const reduceMaxHealthPreportion = 0.2;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Mana,
    sfx: '',
    supportQuantity: true,
    manaCost: 0,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    allowNonUnitTarget: true,
    thumbnail: 'spellIconDeathWager.png',
    description: ['spell_death_wager', Math.round(reduceMaxHealthPreportion * 100).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      const player = underworld.players.find(p => p.unit == state.casterUnit);
      if (player) {
        if (state.casterUnit.healthMax <= 1) {
          {
            floatingText({
              coords: state.casterUnit, text: `Cannot cast ${id} with only 1 max health.`
            });
            return state;
          }
        }
        for (let key of Object.keys(player.cardUsageCounts)) {
          delete player.cardUsageCounts[key];
        }
        state.casterUnit.healthMax *= (1.0 - reduceMaxHealthPreportion);
        state.casterUnit.health = Math.min(state.casterUnit.healthMax, state.casterUnit.health);
      }
      return state;
    },
  },
};
export default spell;
