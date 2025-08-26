import * as config from '../config';
import { refundLastSpell, Spell } from './index';
import { makeManaTrail } from '../graphics/Particles';
import { CardCategory } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { manaBurnCardId } from './mana_burn';
import { healManaUnit } from '../effects/heal';

const id = 'Mana Steal';
const base_mana_stolen = 120;
const health_burn = 30;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Mana,
    sfx: 'manaSteal',
    requires: [manaBurnCardId],
    supportQuantity: true,
    manaCost: 0,
    costGrowthAlgorithm: 'nlogn',
    healthCost: health_burn,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconManaSteal.png',
    omitForWizardType: ['Deathmason', 'Goru'],
    description: ['spell_mana_steal', base_mana_stolen.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive && u.mana > 0);
      const caster = state.casterUnit;
      let promises = [];
      // Start with the amount we intend to steal, adjust after for loop
      let totalManaStolen = base_mana_stolen * quantity;
      let remainingManaToSteal = totalManaStolen;

      // sort targets by current mana to carry remainder, in case you try to steal more mana than a unit has
      targets.sort((a, b) => a.mana - b.mana);
      for (let i = 0; i < targets.length; i++) {
        const unit = targets[i];
        if (unit) {
          const unitManaStolen = Math.min(unit.mana, Math.ceil(remainingManaToSteal / (targets.length - i)));
          remainingManaToSteal -= unitManaStolen;
          unit.mana -= unitManaStolen;
          if (!prediction) {
            for (let i = 0; i < quantity; i++) {
              promises.push(makeManaTrail(unit, caster, underworld, '#e4f9ff', '#3fcbff', targets.length * quantity));
            }
          }
        }
      }
      await Promise.all(promises)

      // In case there wasn't enough mana to steal
      totalManaStolen -= remainingManaToSteal;
      if (totalManaStolen > 0) {
        await healManaUnit(state.casterUnit, totalManaStolen, state.casterUnit, underworld, prediction, state);
      } else {
        refundLastSpell(state, prediction, 'No targets have mana to steal\nHealth cost refunded')
      }
      return state;
    },
  },
};
export default spell;
