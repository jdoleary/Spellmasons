import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import floatingText from '../graphics/FloatingText';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const shieldId = 'shield';
export const modifierImagePath = 'modifierShield.png';
const shieldToAdd = 30;
const spell: Spell = {
  card: {
    id: shieldId,
    category: CardCategory.Blessings,
    sfx: 'shield',
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    soulFragmentCostOverride: 4,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconShield.png',
    animationPath: 'spellShield',
    description: ['spell_shield', shieldToAdd.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        let animationPromise = Promise.resolve();
        for (let unit of targets) {
          animationPromise = Image.addOneOffAnimation(unit, 'priestProjectileHit', {}, { loop: false });
        }
        playDefaultSpellSFX(card, prediction);
        // We only need to wait for one of these promises, since they all take the same amount of time to complete
        await animationPromise;
        // Add the modifier after the animation so that the subsprite doesn't get added until after the animation is
        // complete
        for (let unit of targets) {
          Unit.addModifier(unit, shieldId, underworld, prediction, shieldToAdd * quantity);
        }
      }

      return state;
    },
  },
  modifiers: {
    add,
    addModifierVisuals(unit, underworld) {
      // Add subsprite image
      Image.addSubSprite(unit.image, modifierImagePath);
    },
    subsprite: {
      imageName: modifierImagePath,
      alpha: 0.5,
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
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[shieldId];
      if (modifier) {
        // Set tooltip:
        modifier.tooltip = `${modifier.quantity} ${i18n('Shield')}`;
      }
    },
    onTakeDamage: (unit, amount, underworld, prediction, damageDealer) => {
      const modifier = unit.modifiers[shieldId];
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
          adjustedAmount = Math.max(0, amount - modifier.quantity);
          modifier.quantity -= amount - adjustedAmount;

          // Ensure shield quantity won't remain stuck if decimal
          if (modifier && modifier.quantity < 0.5) {
            Unit.removeModifier(unit, shieldId, underworld);
          }

          return adjustedAmount;
        }
      }

      return amount;
    },
  },

};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, shieldId, { isCurse: false, quantity }, () => {
    Unit.addEvent(unit, shieldId);
  });
}
export default spell;
