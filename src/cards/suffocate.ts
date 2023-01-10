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

export const suffocateCardId = 'suffocate';
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, suffocateCardId, { isCurse: true, quantity, persistBetweenLevels: false }, () => {
    // Add event
    if (!unit.onTurnStartEvents.includes(suffocateCardId)) {
      unit.onTurnStartEvents.push(suffocateCardId);
    }
    // Add subsprite image
    if (!prediction) {
      if (spell.modifiers?.subsprite) {
        Image.addSubSprite(unit.image, spell.modifiers.subsprite.imageName);
      }
    }
  });
  modifier.turnsLeftToLive = 1 + Math.ceil(unit.health / 20 / modifier.quantity)
  if (!prediction) {
    // Temporarily use floating text until spell animation is finished
    floatingText({ coords: unit, text: suffocateCardId });
    updateTooltip(unit);
  }
}
function updateTooltip(unit: Unit.IUnit) {
  if (unit.modifiers[suffocateCardId]) {
    // Set tooltip:
    unit.modifiers[suffocateCardId].tooltip = `${unit.modifiers[suffocateCardId].turnsLeftToLive} turns until suffocation`
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
    onTurnStart: async (unit: IUnit, prediction: boolean, underworld: Underworld) => {
      const modifier = unit.modifiers[suffocateCardId];
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
          console.error(`Should have ${suffocateCardId} modifier on unit but it is missing`);
        }
      }
      return false;
    },
  },
};
export default spell;
