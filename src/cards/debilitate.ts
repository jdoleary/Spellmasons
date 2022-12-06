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
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    sfx: 'debilitate',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconDebilitate.png',
    animationPath: 'spell-effects/spellDebilitate',
    description: `
Makes the target(s) take double damage whenever they receive damage.
"Debilitate" can be cast multiple times in succession to stack it's effect.
    `,
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
    subsprite: {
      imageName,
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.25,
        y: 0.25,
      },
    },
  },
  events: {
    onDamage: (unit, amount, _underworld, damageDealer) => {
      const quantity = unit.modifiers[id]?.quantity || 1;
      // Magnify positive damage
      if (amount > 0) {
        return amount * 2 * quantity;
      } else {
        // Do not magnify negative damage (which is healing)
        return amount;
      }
    },
  },
};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, id, { isCurse: true, quantity, persistBetweenLevels: false }, () => {
    unit.onDamageEvents.push(id);
    // Add subsprite image
    Image.addSubSprite(unit.image, imageName);
  });
}
export default spell;
