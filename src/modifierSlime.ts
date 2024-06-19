import { registerEvents, registerModifiers } from "./cards";
import { animateMitosis } from "./cards/clone";
import { doSplit, splitId } from "./cards/split";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import Underworld from './Underworld';

export const slimeId = 'Slime';
export default function registerSlime() {
  registerModifiers(slimeId, {
    description: 'Causes a unit to split into two units every turn.',
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, slimeId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        // Add events
        if (!unit.onTurnEndEvents.includes(slimeId)) {
          unit.onTurnEndEvents.push(slimeId);
        }
      });
    },
  });
  registerEvents(slimeId, {
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      await animateMitosis(unit.image);
      floatingText({ coords: unit, text: slimeId, prediction });
      doSplit(unit, underworld, 1, prediction);
      // Stop splitting after 3
      if (unit.modifiers[splitId]?.quantity || 0 >= 3) {
        Unit.removeModifier(unit, slimeId, underworld)
      }
    }
  });
}
