import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { UnitType } from "./types/commonTypes";
import Underworld from './Underworld';
import floatingText from './graphics/FloatingText';
import * as colors from './graphics/ui/colors';

export const impendingDoomId = 'impendingDoom';
export default function registerImpendingDoom() {
  registerModifiers(impendingDoomId, {
    add: (unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, impendingDoomId, { isCurse: true, quantity }, () => {
        if (!unit.onTurnEndEvents.includes(impendingDoomId)) {
          unit.onTurnEndEvents.push(impendingDoomId);
        }
      });
      updateTooltip(unit);
    }
  });

  function updateTooltip(unit: Unit.IUnit) {
    if (unit.modifiers[impendingDoomId]) {
      // Set tooltip:
      unit.modifiers[impendingDoomId].tooltip = `${i18n('impending doom')} ${unit.modifiers[impendingDoomId].quantity}...`
    }
  }

  registerEvents(impendingDoomId, {
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[impendingDoomId];
      if (!prediction) {
        if (modifier) {
          // Decrement the turns left to live
          modifier.quantity -= 1;
          updateTooltip(unit);
          if (modifier.quantity <= 0) {
            Unit.die(unit, underworld, prediction);
            floatingText({
              coords: unit, text: `Blehg!`,
              style: { fill: colors.healthRed },
            });
          }
        } else {
          console.error(`Should have ${impendingDoomId} modifier on unit but it is missing`);
        }
      }
    },
  });
}