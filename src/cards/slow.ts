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
const slowPercentage = 30;
function remove(unit: Unit.IUnit, underworld: Underworld) {
  const modifier = unit.modifiers[slowCardId];
  if (!modifier) {
    console.error(`Missing modifier object for ${slowCardId}; cannot remove.  This should never happen`);
    return;
  }

  // Get the current slowMultiplier so we can calculate the inverse of it
  const slowMultiplier = (1 - (modifier.quantity / 100));
  // Prevent divide by 0
  const multiplier = 1 / (slowMultiplier || 1);
  unit.moveSpeed *= multiplier;
  unit.staminaMax *= multiplier;
  unit.stamina *= multiplier;
}
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  // Slow handles quantity differently than other modifiers, so override to 0
  const modifier = getOrInitModifier(unit, slowCardId, { isCurse: true, quantity: 0 }, () => {
    Unit.addEvent(unit, slowCardId);
  });

  // Quantity = Slow % (I.E. 20 quantity = 80% multiplier to move speed and stamina)
  // Quantity is formulaically capped at 100, or a 100% slow, but
  // this shouldn't be attainable under normal circumstances

  // Slow is unique in that the added quantity is multiplicative, and thus has diminishing returns:
  // Adding a 50% slow to a unit without slow gives 50 quantity (or a total 50% slow)
  // Adding a 20% slow after this will add another 10 quantity, (or a total 60% slow)

  // Figure out new quantity (multiplicative)
  modifier.quantity = modifier.quantity + ((100 - modifier.quantity) * (quantity / 100));
  // Safeguard to prevent slows over 100%
  modifier.quantity = Math.min(modifier.quantity, 100);

  // Apply the added Slow (use the newly added quantity here instead of modifier.quantity)
  const addedSlowMultiplier = (1 - (quantity / 100));
  unit.moveSpeed *= addedSlowMultiplier;
  unit.staminaMax *= addedSlowMultiplier;
  unit.stamina *= addedSlowMultiplier;
  unit.moveSpeed = Math.max(1, unit.moveSpeed);
  unit.staminaMax = Math.max(1, unit.staminaMax);
  unit.stamina = Math.max(1, unit.stamina);
}

const spell: Spell = {
  card: {
    id: slowCardId,
    category: CardCategory.Curses,
    sfx: '',
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconSlow.png',
    animationPath: '',
    description: ['spell_slow', Math.floor(100 - slowPercentage).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        await Promise.all([playDefaultSpellAnimation(card, targets, prediction), playDefaultSpellSFX(card, prediction)]);
        for (let unit of targets) {
          // Each application of slow is multiplicative, so we must add the modifier in a loop
          // more info: https://github.com/jdoleary/Spellmasons/pull/957#discussion_r1713032273
          for (let i = 0; i < quantity; i++) {
            Unit.addModifier(unit, slowCardId, underworld, prediction, slowPercentage);
          }
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
    //   imageName: 'modifierPoisonDrip',
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
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[slowCardId];
      if (modifier) {
        // Set tooltip:
        modifier.tooltip = `${slowCardId} ${modifier.quantity.toFixed(0)}%`;
      }
    },
  },
};
export default spell;
