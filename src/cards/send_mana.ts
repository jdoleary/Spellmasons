import * as Unit from '../entity/Unit';
import * as config from '../config';
import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { makeManaTrail } from '../graphics/Particles';
import { healManaUnits } from '../effects/heal';

export const sendManaCardId = 'Send Mana';
const amount = 20;

const spell: Spell = {
  card: {
    id: sendManaCardId,
    category: CardCategory.Mana,
    sfx: 'potionPickupMana',
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconSendMana.png',
    animationPath: 'potionPickup',
    description: ['spell_send_mana', amount.toString()],
    omitForWizardType: ['Deathmason', 'Goru'],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter(u => u.alive);
      let promises = [];
      for (let unit of targets) {
        if (!prediction) {
          for (let i = 0; i < quantity; i++) {
            promises.push(makeManaTrail(state.casterUnit, unit, underworld, '#e4f9ff', '#3fcbff', targets.length * quantity));
          }
        }
      }
      await Promise.all(promises);
      const finalManaSent = amount * quantity / targets.length;

      await healManaUnits(targets, finalManaSent, state.casterUnit, underworld, prediction, state);
      //refund if no targets ?
      return state;
    },
  },
};
export default spell;
