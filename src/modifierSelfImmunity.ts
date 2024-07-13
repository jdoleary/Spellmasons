import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

// Grants invulnerability to one's own damage (I.E. explosives)
export const selfInvulnerabilityId = 'Self Invulnerability';
export default function registerSelfInvulnerability() {
  registerModifiers(selfInvulnerabilityId, {
    description: 'self invulnerability description',
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, selfInvulnerabilityId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, selfInvulnerabilityId);
      });

      if (!prediction) {
        updateTooltip(unit);
      }
    }
  });
  registerEvents(selfInvulnerabilityId, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[selfInvulnerabilityId];
      if (modifier) {
        // If the source of incoming damage is myself, negate it
        if (damageDealer == unit && amount > 0) {
          amount = 0;
        }
      }

      return amount;
    }
  });
}

function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[selfInvulnerabilityId];
  if (modifier) {
    // Set tooltip:
    modifier.tooltip = `${i18n('Invulnerable')} to self ${i18n('Damage')}`
  }
}