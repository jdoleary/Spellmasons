import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';

const id = 'Debilitate';
const imageName = 'vulnerable.png';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'vulnerable.png',
    animationPath: 'spell-effects/spellDebilitate',
    description: `
Makes the target(s) take double damage whenever they receive damage
in the future.
    `,
    effect: async (state, quantity, underworld, prediction) => {
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id, underworld);
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

function add(unit: Unit.IUnit) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = { isCurse: true };
  }
  // Add event
  unit.onDamageEvents.push(id);

  // Add subsprite image
  Image.addSubSprite(unit.image, id);
}
export default spell;
