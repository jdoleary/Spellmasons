import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const modifierBasePierceId = 'Default Pierce';
export default function registerBasePierce() {
  registerModifiers(modifierBasePierceId, {
    description: 'Increases default projectile pierce by [quantity]',
    costPerUpgrade: 80,
    quantityPerUpgrade: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, modifierBasePierceId, { isCurse: false, quantity, keepOnDeath: true }, () => {
      });

      if (!prediction) {
        updateTooltip(unit);
      }
    }
  });
}

function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[modifierBasePierceId];
  if (modifier) {
    // Set tooltip:
    modifier.tooltip = `${modifier.quantity} ${i18n('Base Pierce')}`
  }
}