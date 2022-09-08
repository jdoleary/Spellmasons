import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import floatingText from '../graphics/FloatingText';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';

export const id = 'shield';
export const modifierImagePath = 'spell-effects/modifierShield.png';
const damageBlocked = 3;
const maxStack = 1;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    sfx: 'shield',
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'spellIconShield.png',
    animationPath: 'spell-effects/spellShield',
    description: `
Protects bearer from the next ${damageBlocked} damage that they would incur.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let animationPromise = Promise.resolve();
      for (let unit of state.targetedUnits) {
        animationPromise = Unit.addOneOffAnimation(unit, 'projectile/priestProjectileHit', {}, { loop: false });
      }
      playDefaultSpellSFX(card, prediction);
      // We only need to wait for one of these promises, since they all take the same amount of time to complete
      await animationPromise;
      // Add the modifier after the animation so that the subsprite doesn't get added until after the animation is
      // complete
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id, underworld, prediction);
      }

      return state;
    },
  },
  modifiers: {
    add,
    subsprite: {
      imageName: modifierImagePath,
      alpha: 1.0,
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 1.0,
        y: 1.0,
      },
    },
  },
  events: {
    onDamage: (unit, amount, underworld, prediction, damageDealer) => {
      const modifier = unit.modifiers[id];
      if (modifier) {
        // Only block damage, not heals
        if (amount > 0) {
          let adjustedAmount = amount;
          if (!prediction) {
            floatingText({
              coords: unit,
              text: 'Shielded from damage!',
              style: {
                fill: 'blue',
                ...config.PIXI_TEXT_DROP_SHADOW
              },
            });
          }
          adjustedAmount = Math.max(0, amount - modifier.damage_block);
          modifier.damage_block -= amount - adjustedAmount;

          if (modifier && modifier.damage_block <= 0) {
            Unit.removeModifier(unit, id, underworld);
          }

          return adjustedAmount;
        } else {
          return amount;
        }
      } else {
        return amount;
      }
    },
  },

};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  // First time setup
  let modifier = unit.modifiers[id];
  if (!modifier) {
    unit.modifiers[id] = {
      isCurse: false,
    };
    // Add event
    unit.onDamageEvents.push(id);
    // Add subsprite image
    Image.addSubSprite(unit.image, modifierImagePath);
  }
  modifier = unit.modifiers[id];
  if (modifier) {

    // Increment the number of damage_block on this modifier
    modifier.damage_block = (modifier.damage_block || 0) + damageBlocked * quantity;
    const maxBlock = maxStack * damageBlocked;
    if (modifier.damage_block > maxBlock) {
      // Cap how much shield a unit can have
      modifier.damage_block = maxBlock;
      floatingText({ coords: unit, text: `Maximum shield` });
    }
  }
}
export default spell;
