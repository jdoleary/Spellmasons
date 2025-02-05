import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const modifierBaseRadiusBoostId = 'Default Radius Boost';
export default function registerBaseRadiusBoost() {
  registerModifiers(modifierBaseRadiusBoostId, {
    description: ('rune_base_radius'),
    _costPerUpgrade: 100,
    quantityPerUpgrade: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, modifierBaseRadiusBoostId, { isCurse: false, quantity, keepOnDeath: true }, () => {
      });
    }
  });
  registerEvents(modifierBaseRadiusBoostId, {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[modifierBaseRadiusBoostId];
      if (modifier) {
        // Set tooltip:
        modifier.tooltip = `+${modifier.quantity} ${i18n('Radius Boost')}`;
      }
    },
  });
}