import { Spell } from './index';
import * as Unit from '../entity/Unit'
import { CardCategory } from '../types/commonTypes';
import Underworld from '../Underworld';
import throttle from 'lodash.throttle';
import { Vec2 } from '../jmath/Vec';
import floatingText from '../graphics/FloatingText';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const id = 'protection';
function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  getOrInitModifier(unit, id, { isCurse: false, quantity }, () => { });
}
export const notifyProtected = throttle((coords: Vec2, prediction: boolean) => {
  floatingText({ coords, text: prediction ? 'Protection: spell will be nullified' : `Spell nullified by Protection` });
}, 1000, { trailing: false });
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    supportQuantity: true,
    thumbnail: 'spellIconProtection.png',
    description: 'Prevents unit from being targeted by magic (helpful magic or harmful magic).',
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      for (let unit of targets) {
        Unit.addModifier(unit, id, underworld, prediction, quantity);
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
};
export default spell;
