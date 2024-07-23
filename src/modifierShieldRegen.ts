import { registerEvents, registerModifiers } from "./cards";
import { shieldId } from "./cards/shield";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

// Regenerates [quantity] shield at the start of each turn
export const shieldRegenId = 'Shield Regen';
export default function registerShieldRegen() {
  registerModifiers(shieldRegenId, {
    description: 'Regenerates [quantity] shield at the start of each turn',
    cost: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, shieldRegenId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, shieldRegenId);
      });

      if (!prediction) {
        updateTooltip(unit);
      }
    }
  });
  registerEvents(shieldRegenId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[shieldRegenId];
      if (modifier) {
        Unit.addModifier(unit, shieldId, underworld, prediction, modifier.quantity);
      }
    }
  });
}

function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[shieldRegenId];
  if (modifier) {
    // Set tooltip:
    modifier.tooltip = `${modifier.quantity} ${i18n('Shield')} ${i18n('Regen')}`
  }
}