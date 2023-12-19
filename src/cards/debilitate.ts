import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

const id = 'Debilitate';
const imageName = 'spellIconDebilitate.png';
const proportion = 2;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    sfx: 'debilitate',
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconDebilitate.png',
    animationPath: 'spell-effects/spellDebilitate',
    description: ['spell_debilitate', (proportion * 100).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          Unit.addModifier(unit, id, underworld, prediction, quantity);
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
  events: {
    onDamage: (unit, amount, _underworld, damageDealer) => {
      const quantity = unit.modifiers[id]?.quantity || 1;
      // Magnify positive damage
      if (amount > 0) {
        return amount * proportion * quantity;
      } else {
        // Do not magnify negative damage (which is healing)
        return amount;
      }
    },
  },
};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, id, { isCurse: true, quantity }, () => {
    unit.onDamageEvents.push(id);
  });
}
export default spell;
