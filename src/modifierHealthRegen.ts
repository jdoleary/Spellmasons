import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import { healUnit } from "./effects/heal";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

// Regenerates [quantity] health at the start of each turn
export const healthRegenId = 'Health Regen';
export default function registerHealthRegen() {
  registerModifiers(healthRegenId, {
    description: 'Regenerates [quantity] health at the start of each turn',
    costPerUpgrade: 20,
    quantityPerUpgrade: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, healthRegenId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, healthRegenId);
      });

      if (!prediction) {
        updateTooltip(unit);
      }
    }
  });
  registerEvents(healthRegenId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[healthRegenId];
      if (modifier) {
        healUnit(unit, modifier.quantity, unit, underworld, prediction);
      }
    }
  });
}

function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[healthRegenId];
  if (modifier) {
    // Set tooltip:
    modifier.tooltip = `${modifier.quantity} ${i18n('Health')} ${i18n('Regen')}`
  }
}