import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as config from './config';
import * as Image from './graphics/Image';
import floatingText from "./graphics/FloatingText";
import Underworld from './Underworld';

// Damage is taken from mana before health at [quantity]% effectiveness
export const manaBarrierId = 'Mana Barrier';
export const modifierImagePath = 'spell-effects/modifierShield.png';
export default function registerManaBarrier() {
  registerModifiers(manaBarrierId, {
    description: 'Damage is taken from unused mana before health at [quantity]% effectiveness',
    costPerUpgrade: 100,
    quantityPerUpgrade: 50,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, manaBarrierId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, manaBarrierId);

        // Add subsprite image
        const animatedBarrierSprite = Image.addSubSprite(unit.image, modifierImagePath);
        if (animatedBarrierSprite) {
          // Make it blue just so it looks distinct from shield
          animatedBarrierSprite.tint = 0x0000ff;
        }
      });

      if (!prediction) {
        updateTooltip(unit);
      }
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
  });
  registerEvents(manaBarrierId, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[manaBarrierId];
      if (modifier) {
        // If the incoming effect is damage (not healing)
        if (amount > 0) {
          // Damage should be taken from mana before health
          const blockableDamage = Math.floor(Math.min(amount, unit.mana * CalcMult(modifier.quantity)));
          if (blockableDamage > 0) {
            amount -= blockableDamage;
            unit.mana -= blockableDamage / CalcMult(modifier.quantity);
            unit.mana = Math.floor(unit.mana); // To prevents rounding errors
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
            updateTooltip(unit);
          }
        }
      }

      // Does not modify incoming damage/healing otherwise
      return amount;
    },
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[manaBarrierId];
      if (modifier) {
        updateTooltip(unit);
      }
    }
  });
}

export function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[manaBarrierId];
  if (modifier) {
    // Set tooltip:
    // modifier.tooltip = `${modifier.quantity}% ${i18n('Mana Barrier')}`

    // This returns the maximum blockable damage,
    // based on the unit's mana and modifier quantity
    // We need to update this any time mana changes
    modifier.tooltip = `${Math.floor(unit.mana * CalcMult(modifier.quantity))} ${i18n('Damage')} ${i18n('Mana Barrier')}`
  }
}

function CalcMult(quantity: number): number {
  // Each Quantity = 1% barrier effectiveness
  // 100(%) quantity = 1:1 ratio = 1 mana blocks 1 damage
  // 20(%) quantity = 5:1 ratio = 5 mana blocks 1 damage
  return quantity / 100;
}