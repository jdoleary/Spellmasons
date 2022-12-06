import { IUnit } from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import floatingText from '../graphics/FloatingText';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const id = 'suffocate';
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, id, { isCurse: true, quantity, persistBetweenLevels: false }, () => {
    // Add event
    if (!unit.onTurnStartEvents.includes(id)) {
      unit.onTurnStartEvents.push(id);
    }
    // Add subsprite image
    if (!prediction) {
      if (spell.modifiers?.subsprite) {
        Image.addSubSprite(unit.image, spell.modifiers.subsprite.imageName);
      }
    }
  });
  modifier.turnsLeftToLive = 1 + Math.ceil(unit.health / 2 / modifier.quantity)
  if (!prediction) {
    // Temporarily use floating text until spell animation is finished
    floatingText({ coords: unit, text: id });
    updateTooltip(unit);
  }
}
function updateTooltip(unit: Unit.IUnit) {
  if (unit.modifiers[id]) {
    // Set tooltip:
    unit.modifiers[id].tooltip = `${unit.modifiers[id].turnsLeftToLive} turns until suffocation`
  }
}

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    sfx: 'suffocate',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconSuffocate.png',
    // animationPath: 'spell-effects/TODO',
    description: `
A curse that causes sudden death after a number of turns have passed.
The number of turns are relative to the target's health when the curse it applied.
Less health = quicker death.
Stacking ${id} will make death occur in less turns.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        await Promise.all([playDefaultSpellAnimation(card, targets, prediction), playDefaultSpellSFX(card, prediction)]);
        for (let unit of targets) {
          Unit.addModifier(unit, id, underworld, prediction, quantity);
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
    // init,
    // subsprite: {
    //   imageName: 'spell-effects/TODO',
    //   alpha: 1.0,
    //   anchor: {
    //     x: 0.6,
    //     y: 0.5,
    //   },
    //   scale: {
    //     x: 1.0,
    //     y: 1.0,
    //   },
    // },
  },
  events: {
    onTurnStart: async (unit: IUnit, prediction: boolean, underworld: Underworld) => {
      const modifier = unit.modifiers[id];
      if (!prediction) {
        if (modifier) {
          // Decrement the turns left to live
          modifier.turnsLeftToLive -= 1;
          updateTooltip(unit);
          if (modifier.turnsLeftToLive <= 0) {
            Unit.die(unit, underworld, prediction);
            floatingText({
              coords: unit, text: `Suffocated!`,
              style: { fill: colors.healthRed },
            });
          }
        } else {
          console.error(`Should have ${id} modifier on unit but it is missing`);
        }
      }
      return false;
    },
  },
};
export default spell;
