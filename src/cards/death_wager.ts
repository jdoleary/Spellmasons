import { Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import floatingText from '../graphics/FloatingText';
import throttle from 'lodash.throttle';
import { IUnit } from '../entity/Unit';
import { addWarningAtMouse } from '../graphics/PlanningView';

const id = 'Death Wager';
const notifyError = throttle((casterUnit: IUnit) => {
  floatingText({
    coords: casterUnit, text: `death_wager_error1`, style: { fill: 'red' }

  });
}, 1000, { leading: true });
const notifyError2 = throttle((casterUnit: IUnit) => {
  floatingText({
    coords: casterUnit, text: `death_wager_error2`, style: { fill: 'red' }
  });
}, 1000, { leading: true });
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
    description: ['spell_death_wager'],
    effect: async (state, card, quantity, underworld, prediction) => {
      const player = underworld.players.find(p => prediction ? p.unit.predictionCopy == state.casterUnit : p.unit == state.casterUnit);
      if (player) {
        if (state.casterUnit.health < state.casterUnit.healthMax) {
          if (prediction) {
            addWarningAtMouse('death_wager_error1');
          } else {
            notifyError(state.casterUnit);
          }
          return state;
        }
        if (state.cardIds.length > 1) {
          if (prediction) {
            addWarningAtMouse('death_wager_error2');
          } else {
            notifyError2(state.casterUnit);
          }
          return state;

        }
        if (!prediction) {
          for (let key of Object.keys(player.cardUsageCounts)) {
            delete player.cardUsageCounts[key];
          }
        }
        state.casterCardUsage = {};
        state.casterUnit.health = 1;
      }
      return state;
    },
  },
};
export default spell;
