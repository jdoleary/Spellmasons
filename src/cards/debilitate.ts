import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation } from './cardUtils';
import { Spell } from './index';

const id = 'Debilitate';
const imageName = 'vulnerable.png';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'spellIconDebilitate.png',
    animationPath: 'spell-effects/spellDebilitate',
    description: `
Makes the target(s) take double damage whenever they receive damage
in the future.
"Debilitate" can be cast multiple times in succession to stack it's effect.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      await playDefaultSpellAnimation(card, state.targetedUnits, prediction);
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id, underworld, prediction);
      }
      return state;
    },
  },
  modifiers: {
    add,
    subsprite: {
      imageName,
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  },
  events: {
    onDamage: (unit, amount, _underworld, damageDealer) => {
      // Magnify positive damage
      if (amount > 0) {
        return amount * 2;
      } else {
        return amount;
      }
    },
  },
};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = { isCurse: true };
  }
  // Add event, stackable via quantity
  for (let i = 0; i < quantity; i++) {
    unit.onDamageEvents.push(id);
  }

  // Add subsprite image
  Image.addSubSprite(unit.image, id);
}
export default spell;
