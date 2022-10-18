import { Spell } from './index';
import * as Unit from '../entity/Unit'
import { CardCategory } from '../types/commonTypes';
import Underworld from '../Underworld';
import throttle from 'lodash.throttle';
import { Vec2 } from '../jmath/Vec';
import floatingText from '../graphics/FloatingText';
import { CardRarity, probabilityMap } from '../graphics/ui/CardUI';

export const id = 'protection';
function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  // First time setup
  let modifier = unit.modifiers[id];
  if (!modifier) {
    unit.modifiers[id] = {
      isCurse: false,
    };
  }
}
export const notifyProtected = throttle((coords: Vec2) => {
  floatingText({ coords, text: `Protection!` });
}, 1000, { trailing: true });
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconProtection.png',
    description: 'Prevents unit from being targeted by magic once',
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      for (let unit of targets) {
        Unit.addModifier(unit, id, underworld, prediction);
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
};
export default spell;
