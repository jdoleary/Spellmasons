import { Spell } from './index';
import * as Unit from '../entity/Unit'
import { CardCategory } from '../types/commonTypes';
import Underworld from '../Underworld';
import throttle from 'lodash.throttle';
import { Vec2 } from '../jmath/Vec';
import floatingText from '../graphics/FloatingText';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const id = 'Nullify';
function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  getOrInitModifier(unit, id, { isCurse: false, quantity }, () => { });
}
export const notifyProtected = throttle((coords: Vec2, prediction: boolean) => {
  // TODO: i18n: Translate
  floatingText({ coords, text: prediction ? `spell will be nullified` : `Spell nullified` });
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
    description: 'spell_protection',
    // TODO timeout needs verification
    timeoutMs: 2000,
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits;
      for (let unit of targets) {
        Unit.addModifier(unit, id, underworld, prediction, quantity);
        if (!prediction) {
          floatingText({ coords: unit, text: 'Next spell will be nullified.' });
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
};
export default spell;
