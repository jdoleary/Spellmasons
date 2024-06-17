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

export const id = 'shield';
export const modifierImagePath = 'spell-effects/modifierShield.png';
const damageMult = 1.5;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    sfx: 'shield',
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconShield.png',
    animationPath: 'spell-effects/spellShield',
    description: ['spell_shield', Unit.GetSpellDamage(undefined, damageMult).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        let animationPromise = Promise.resolve();
        for (let unit of targets) {
          animationPromise = Image.addOneOffAnimation(unit, 'projectile/priestProjectileHit', {}, { loop: false });
        }
        playDefaultSpellSFX(card, prediction);
        // We only need to wait for one of these promises, since they all take the same amount of time to complete
        await animationPromise;
        // Add the modifier after the animation so that the subsprite doesn't get added until after the animation is
        // complete
        for (let unit of targets) {
          Unit.addModifier(unit, id, underworld, prediction, Unit.GetSpellDamage(state.casterUnit.damage, damageMult) * quantity);
        }
      }

      return state;
    },
  },
  modifiers: {
    add,
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
    onTakeDamage: (unit, amount, underworld, prediction, damageDealer) => {
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
          adjustedAmount = Math.max(0, amount - modifier.quantity);
          modifier.quantity -= amount - adjustedAmount;

          if (modifier && modifier.quantity <= 0) {
            Unit.removeModifier(unit, id, underworld);
          }
          updateTooltip(unit);

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
function updateTooltip(unit: Unit.IUnit) {
  if (unit.modifiers[id]) {
    // Set tooltip:
    unit.modifiers[id].tooltip = `${unit.modifiers[id].quantity} damage block`
  }
}

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, id, { isCurse: false, quantity }, () => {
    // Add event
    unit.onTakeDamageEvents.push(id);
    // Add subsprite image
    Image.addSubSprite(unit.image, modifierImagePath);
  });

  updateTooltip(unit);
}
export default spell;
