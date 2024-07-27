import { registerEvents, registerModifiers } from "./cards";
import { animateMitosis, doCloneUnit } from "./cards/clone";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import Underworld from './Underworld';

export const slimeId = 'Slime';
export default function registerSlime() {
  registerModifiers(slimeId, {
    description: 'Causes a unit to split into two units every turn.',
    probability: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, slimeId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, slimeId);
      });
    },
  });
  registerEvents(slimeId, {
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (!unit.alive) {
        return;
      }
      await animateMitosis(unit.image);
      const clone = doCloneUnit(unit, underworld, prediction);
      if (clone) {
        floatingText({ coords: unit, text: slimeId, prediction });
        // Only the source unit maintains slimeId or else it gets exponential
        Unit.removeModifier(clone, slimeId, underworld)
      }
    }
  });
}
