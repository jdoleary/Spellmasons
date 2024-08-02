import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import * as Cards from './cards';

// Deals [quantity] damage to an attacker when hit
export const thornsId = 'Thorns';
export default function registerThorns() {
  registerModifiers(thornsId, {
    unitOfMeasure: 'Damage',
    description: (unit, modifierSource, quantity, modifierInstance) => i18n(['rune_thorns_description']),
    costPerUpgrade: 80,
    quantityPerUpgrade: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, thornsId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, thornsId);
      });

      if (!prediction) {
        updateTooltip(unit);
      }
    }
  });
  registerEvents(thornsId, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[thornsId];
      if (modifier) {
        // Thorns will not deal damage if we are being healed
        if (damageDealer && amount > 0) {
          // Thorns should not trigger thorns
          // Exception: Temporarily remove the damageDealer's Thorns event to prevent infinite loop
          damageDealer.events = damageDealer.events.filter(x => x !== thornsId);

          // Deal flat damage to the attacker
          Unit.takeDamage({
            unit: damageDealer,
            amount: modifier.quantity,
            sourceUnit: unit,
          }, underworld, prediction);

          // Restore the Thorns event if the damageDealer still has the Thorns modifier
          if (damageDealer.modifiers[thornsId]) {
            Unit.addEvent(damageDealer, thornsId);
          }
        }
      }

      // Thorns does not modify incoming damage
      return amount;
    }
  });
}

function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[thornsId];
  const modifierSource = Cards.allModifiers[thornsId];
  if (modifier) {
    // Set tooltip:
    modifier.tooltip = `${i18n('Thorns')}: ${modifier.quantity} ${modifierSource?.unitOfMeasure || ''}`
  }
}