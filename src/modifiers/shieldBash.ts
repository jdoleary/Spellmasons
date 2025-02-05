import { registerEvents, registerModifiers } from "../cards";
import { shieldId } from "../cards/shield";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

// Consume [quantity] shield to deal [quantity] extra damage when you deal damage
export const shieldBashId = 'Shield Bash';
export default function registerShieldBash() {
  registerModifiers(shieldBashId, {
    description: 'rune_shield_bash',
    unitOfMeasure: 'shield to damage',
    stage: "Amount Flat",
    _costPerUpgrade: 20,
    quantityPerUpgrade: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, shieldBashId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, shieldBashId);
      });
    }
  });
  registerEvents(shieldBashId, {
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      const modifier = damageDealer.modifiers[shieldBashId];
      if (modifier) {
        // Shield Bash is only applied if damage is dealt, not when healing
        if (damageReciever && amount > 0) {
          // Consume up to quantity shield to deal quantity extra damage
          const shieldModifier = damageDealer.modifiers[shieldId];
          if (shieldModifier) {
            const shieldConsumed = Math.min(modifier.quantity, shieldModifier.quantity);

            // Consume shield
            shieldModifier.quantity -= shieldConsumed;
            if (shieldModifier.quantity <= 0) {
              Unit.removeModifier(damageDealer, shieldId, underworld);
            }

            // Increase damage
            amount += shieldConsumed;
          }
        }
      }

      return amount;
    }
  });
}