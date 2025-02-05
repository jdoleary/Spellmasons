import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import { UnitType } from "../types/commonTypes";
import Underworld from '../Underworld';
import floatingText from '../graphics/FloatingText';
import * as colors from '../graphics/ui/colors';

export const impendingDoomId = 'impendingDoom';
export default function registerImpendingDoom() {
  registerModifiers(impendingDoomId, {
    description: "Afflicited unit will die in (quantity) turns",
    add: (unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1, extra?: { [key: string]: any }) => {
      const modifier = getOrInitModifier(unit, impendingDoomId, { isCurse: true, quantity }, () => {
        Unit.addEvent(unit, impendingDoomId);
      });

      if (extra && extra.sourceUnitId != undefined) {
        modifier.sourceUnitId = extra.sourceUnitId;
      }
    }
  });
  registerEvents(impendingDoomId, {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[impendingDoomId];
      if (modifier) {
        // Set tooltip:
        modifier.tooltip = `${i18n('impending doom')} ${modifier.quantity}...`;
      }
    },
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[impendingDoomId];
      if (!prediction) {
        if (modifier) {
          // Decrement the turns left to live
          modifier.quantity -= 1;
          if (modifier.quantity <= 0) {
            const sourceUnit = underworld.getUnitById(modifier.sourceUnitId, prediction);
            Unit.die(unit, underworld, prediction, sourceUnit);
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