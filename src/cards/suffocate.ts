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
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1, extra?: { [key: string]: any }) {
  const modifier = getOrInitModifier(unit, suffocateCardId, { isCurse: true, quantity }, () => {
    Unit.addEvent(unit, suffocateCardId);
    // Add subsprite image
    if (!prediction) {
      if (spell.modifiers?.subsprite) {
        Image.addSubSprite(unit.image, spell.modifiers.subsprite.imageName);
      }
    }
  });

  if (extra && extra.sourceUnitId != undefined) {
    modifier.sourceUnitId = extra.sourceUnitId;
  }

  // One suffocate stack is added per cast and per turn passed
  // Buildup doubles every 2 stacks until > hp, then unit dies
  modifier.buildup = Math.floor(10 * Math.pow(2, (modifier.quantity - 1) / 2));

  // returns true if it kills the unit
  if (updateSuffocate(unit, underworld, prediction)) {
    // nothing to do here
  }
  else if (!prediction) {
    // Show that suffocate was added to the unit
    // Temporarily use floating text until spell animation is finished
    floatingText({ coords: unit, text: suffocateCardId });
    updateTooltip(unit);
  }
}

export function getSuffocateBuildup(unit: Unit.IUnit): number {
  const modifier = unit.modifiers[suffocateCardId];
  if (!modifier) {
    console.warn("Checking for suffocate buildup when the Unit does not have suffocate");
    return 0;
  }

  return modifier.buildup;
}

// Will kill the unit if buildup > current health, else will update the tooltip
// returns true if the unit is killed
export function updateSuffocate(unit: Unit.IUnit, underworld: Underworld, prediction: boolean): boolean {
  const modifier = unit.modifiers[suffocateCardId];
  if (!modifier) {
    console.warn("Checking for suffocate buildup when the Unit does not have suffocate");
    return false;
  }
  //if the buildup of suffocate is greater than unit's health, kill it and make floating text
  if (modifier.buildup >= unit.health) {
    const sourceUnit = underworld.getUnitById(modifier.sourceUnitId, prediction);
    Unit.die(unit, underworld, prediction, sourceUnit);
    if (!prediction) {
      floatingText({
        coords: unit, text: `Suffocated!`,
        style: { fill: colors.healthRed },
      });
    }
    return true;
  }

  updateTooltip(unit);

  return false;
}

export function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[suffocateCardId];
  if (modifier) {
    // calculate turns until suffocation
    const turnsUntilSuffocation = Math.ceil(2 * Math.log2(unit.health / 10) + 1) - modifier.quantity;

    // Set tooltip:
    modifier.tooltip = `${turnsUntilSuffocation} ${i18n('turns until suffocation')}`;
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
          Unit.addModifier(unit, suffocateCardId, underworld, prediction, quantity, { sourceUnitId: state.casterUnit.id });
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
    onTurnEnd: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[suffocateCardId];
      if (!prediction) {
        if (modifier) {
          Unit.addModifier(unit, suffocateCardId, underworld, prediction, 1);
        } else {
          console.error(`Should have ${suffocateCardId} modifier on unit but it is missing`);
        }
      }
    },
  },
};
export default spell;
