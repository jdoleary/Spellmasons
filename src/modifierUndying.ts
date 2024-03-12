import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

// A modifier that makes a unit resurrect during its next onTurnStart()
export const undyingModifierId = 'undying';
export default function registerUndying() {
  registerModifiers(undyingModifierId, {
    add: (unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, undyingModifierId, { isCurse: true, quantity, keepOnDeath: true }, () => {
        // Add event
        if (!unit.onTurnStartEvents.includes(undyingModifierId)) {
          unit.onTurnStartEvents.push(undyingModifierId);
        }
      });
    }
  });
  registerEvents(undyingModifierId, {
    onTurnStart: async (unit: Unit.IUnit, prediction: boolean, underworld: Underworld) => {
      if (!unit.alive) {
        if (!prediction) {
          // Resurrect FX
        }
        Unit.resurrect(unit, underworld);

        const undyingModifier = unit.modifiers[undyingModifierId];
        if (undyingModifier) {
          undyingModifier.quantity -= 1;
          if (undyingModifier.quantity <= 0) {
            Unit.removeModifier(unit, undyingModifierId, underworld);
          }
        } else {
          console.error("No undying modifier present for undying event. This shouldn't be possible ", unit);
        }
      }
    }
  });
}