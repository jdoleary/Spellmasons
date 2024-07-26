import { registerEvents, registerModifiers } from "./cards";
import { poisonCardId } from "./cards/poison";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

// Applies (quantity) poison on hit
export const onHitPoisonId = 'Inflict Poison';
export default function registerOnHitPoison() {
  registerModifiers(onHitPoisonId, {
    description: 'Applies [quantity] poison when you deal damage',
    costPerUpgrade: 80,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, onHitPoisonId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, onHitPoisonId);
      });

      if (!prediction) {
        updateTooltip(unit);
      }
    }
  });
  registerEvents(onHitPoisonId, {
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      const modifier = damageDealer.modifiers[onHitPoisonId];
      if (modifier) {
        // Poison is only applied if damage is dealt, not when healing
        if (damageReciever && amount > 0) {
          // Apply poison to the damage reciever
          Unit.addModifier(damageReciever, poisonCardId, underworld, prediction, modifier.quantity, { sourceUnitId: damageDealer.id });
        }
      }

      // On Hit Poison does not modify outgoing damage
      return amount;
    }
  });
}

function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[onHitPoisonId];
  if (modifier) {
    // Set tooltip:
    modifier.tooltip = `${modifier.quantity} ${i18n('On Hit')} ${i18n('Poison')}`
  }
}