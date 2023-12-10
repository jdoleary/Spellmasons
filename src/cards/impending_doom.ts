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

export const impendingDoomCardId = 'impending doom';
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, impendingDoomCardId, { isCurse: true, quantity, persistBetweenLevels: false }, () => {
    // Add event
    if (!unit.onTurnEndEvents.includes(impendingDoomCardId)) {
      unit.onTurnEndEvents.push(impendingDoomCardId);
    }
    // Add subsprite image
    if (!prediction) {
      if (spell.modifiers?.subsprite) {
        Image.addSubSprite(unit.image, spell.modifiers.subsprite.imageName);
      }
    }
  });

  if (!prediction) {
    // Temporarily use floating text until spell animation is finished
    floatingText({ coords: unit, text: impendingDoomCardId });
    updateTooltip(unit);
  }
}
export function updateTooltip(unit: Unit.IUnit) {
  if (unit.modifiers[impendingDoomCardId]) {
    // Set tooltip:
    unit.modifiers[impendingDoomCardId].tooltip = `Impending doom ${unit.modifiers[impendingDoomCardId].quantity}...`
  }
}

//Dev spell for toxic res: Unit dies in specified number of turns
const spell: Spell = {
  card: {
    id: impendingDoomCardId,
    category: CardCategory.Curses,
    sfx: 'suffocate',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 0,
    thumbnail: 'spellIconSuffocate.png',
    // animationPath: 'spell-effects/TODO',
    description: 'spell_suffocate',
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        await Promise.all([playDefaultSpellAnimation(card, targets, prediction), playDefaultSpellSFX(card, prediction)]);
        for (let unit of targets) {
          Unit.addModifier(unit, impendingDoomCardId, underworld, prediction, quantity);
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
      const modifier = unit.modifiers[impendingDoomCardId];
      if (!prediction) {
        if (modifier) {
          // Decrement the turns left to live
          modifier.quantity -= 1;
          updateTooltip(unit);
          if (modifier.quantity <= 0) {
            Unit.die(unit, underworld, prediction);
            floatingText({
              coords: unit, text: `Blehg!`,
              style: { fill: colors.healthRed },
            });
          }
        } else {
          console.error(`Should have ${impendingDoomCardId} modifier on unit but it is missing`);
        }
      }
      return false;
    },
  },
};
export default spell;
