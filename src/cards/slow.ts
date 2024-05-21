import type * as PIXI from 'pixi.js';
import { IUnit, takeDamage } from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import floatingText from '../graphics/FloatingText';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const slowCardId = 'slow';
const changeProportion = 0.80;
function remove(unit: Unit.IUnit, underworld: Underworld) {
  if (!unit.modifiers[slowCardId]) {
    console.error(`Missing modifier object for ${slowCardId}; cannot remove.  This should never happen`);
    return;
  }
  // Safely restore unit's original properties
  const { staminaMax, moveSpeed } = unit.modifiers[slowCardId].originalStats;

  const staminaChange = staminaMax / unit.staminaMax;
  unit.stamina *= staminaChange;
  unit.stamina = Math.floor(unit.stamina);
  unit.staminaMax = staminaMax;
  // Prevent unexpected overflow
  unit.stamina = Math.min(staminaMax, unit.stamina);

  unit.moveSpeed = moveSpeed;
}
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  const { staminaMax, moveSpeed } = unit;
  const modifier = getOrInitModifier(unit, slowCardId, {
    isCurse: true,
    quantity,
    originalStats: {
      staminaMax,
      moveSpeed
    }
  }, () => { });
  const quantityModifiedChangeProportion = Math.pow(changeProportion, quantity);
  unit.moveSpeed *= quantityModifiedChangeProportion;
  unit.staminaMax *= quantityModifiedChangeProportion;
  unit.stamina *= quantityModifiedChangeProportion;
}

const spell: Spell = {
  card: {
    id: slowCardId,
    category: CardCategory.Curses,
    sfx: '',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconSlow.png',
    animationPath: '',
    description: ['spell_slow', Math.floor(changeProportion * 100).toString()],
    timeoutMs: 20,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        await Promise.all([playDefaultSpellAnimation(card, targets, prediction), playDefaultSpellSFX(card, prediction)]);
        for (let unit of targets) {
          Unit.addModifier(unit, slowCardId, underworld, prediction, quantity);
          if (!prediction) {
            floatingText({ coords: unit, text: 'slow' });
          }
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
    // subsprite: {
    //   imageName: 'spell-effects/modifierPoisonDrip',
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
  },
};
export default spell;
