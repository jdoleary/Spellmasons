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
import { buildMatchMemberExpression } from '@babel/types';

export const suffocateCardId = 'suffocate';
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, suffocateCardId, { isCurse: true, quantity, persistBetweenLevels: false }, () => {
    // Add event
    if (!unit.onTurnEndEvents.includes(suffocateCardId)) {
      unit.onTurnEndEvents.push(suffocateCardId);
    }
    // Add subsprite image
    if (!prediction) {
      if (spell.modifiers?.subsprite) {
        Image.addSubSprite(unit.image, spell.modifiers.subsprite.imageName);
      }
    }
  });

  // One suffocate stack is added per cast and per turn passed
  // Buildup doubles every 2 stacks until > hp, then unit dies
  modifier.buildup = Math.floor(10 * Math.pow(2, (modifier.quantity - 1) / 2));

  if (modifier.buildup >= unit.health) {
    Unit.die(unit, underworld, prediction);
    if (!prediction) {
      floatingText({
        coords: unit, text: `Suffocated!`,
        style: { fill: colors.healthRed },
      });
    }
  }
  else if (!prediction) {
    // Temporarily use floating text until spell animation is finished
    floatingText({ coords: unit, text: suffocateCardId });
    updateTooltip(unit);
  }
}
export function updateTooltip(unit: Unit.IUnit) {
  if (unit.modifiers[suffocateCardId]) {
    // Set tooltip:
    unit.modifiers[suffocateCardId].tooltip = `Suffocate ${unit.modifiers[suffocateCardId].quantity} | ${unit.modifiers[suffocateCardId].buildup} damage`
  }
}

const spell: Spell = {
  card: {
    id: suffocateCardId,
    category: CardCategory.Curses,
    sfx: 'suffocate',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconSuffocate.png',
    // animationPath: 'spell-effects/TODO',
    description: 'spell_suffocate',
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        await Promise.all([playDefaultSpellAnimation(card, targets, prediction), playDefaultSpellSFX(card, prediction)]);
        for (let unit of targets) {
          Unit.addModifier(unit, suffocateCardId, underworld, prediction, quantity);
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
    onTurnEnd: async (unit: IUnit, prediction: boolean, underworld: Underworld) => {
      const modifier = unit.modifiers[suffocateCardId];
      if (!prediction) {
        if (modifier) {
          Unit.addModifier(unit, suffocateCardId, underworld, prediction, 1)
        } else {
          console.error(`Should have ${suffocateCardId} modifier on unit but it is missing`);
        }
      }
    },
  },
};
export default spell;
