import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import { healUnit } from "../effects/heal";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

// Restores [quantity] health on hit
export const onHitHealingId = 'Heal on Attack';
export default function registerOnHitHealing() {
  registerModifiers(onHitHealingId, {
    description: 'rune_on_hit_healing',
    unitOfMeasure: 'health',
    _costPerUpgrade: 60,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, onHitHealingId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, onHitHealingId);
      });
    }
  });
  registerEvents(onHitHealingId, {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[onHitHealingId];
      if (modifier) {
        // Set tooltip:
        modifier.tooltip = `${modifier.quantity} ${i18n('On Hit')} ${i18n('Healing')}`;
      }
    },
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      const modifier = damageDealer.modifiers[onHitHealingId];
      if (modifier) {
        // Healing is only applied if damage is dealt
        if (damageReciever && amount > 0) {
          healUnit(damageDealer, modifier.quantity, damageDealer, underworld, prediction);
        }
      }

      // On Hit Healing does not modify outgoing damage
      return amount;
    }
  });
}