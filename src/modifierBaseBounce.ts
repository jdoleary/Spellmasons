import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const modifierBaseBounceId = 'Default Ricochet';
export default function registerBaseBounce() {
  registerModifiers(modifierBaseBounceId, {
    description: 'Increases default projectile ricochet by [quantity]',
    costPerUpgrade: 60,
    quantityPerUpgrade: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, modifierBaseBounceId, { isCurse: false, quantity, keepOnDeath: true }, () => {
      });

      if (!prediction) {
        updateTooltip(unit);
      }
    }
  });
}

function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[modifierBaseBounceId];
  if (modifier) {
    // Set tooltip:
    modifier.tooltip = `${modifier.quantity} ${i18n('Base Ricochet')}`
  }
}