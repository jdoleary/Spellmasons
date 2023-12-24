import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import * as colors from './graphics/ui/colors';
import floatingText from "./graphics/FloatingText";
import { clone } from "./jmath/Vec";
import { UnitType } from "./types/commonTypes";

export const corpseDecayId = 'Corpse Decay';
export default function registerCorpseDecay() {
  registerModifiers(corpseDecayId, {
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      // Never add this modifier to a player or living unit
      if (unit.unitType == UnitType.PLAYER_CONTROLLED || unit.alive) return;

      const modifier = getOrInitModifier(unit, corpseDecayId, { isCurse: true, quantity }, () => {
        // Add event
        if (!unit.onTurnEndEvents.includes(corpseDecayId)) {
          unit.onTurnEndEvents.push(corpseDecayId);
        }
      });
      modifier.turnsLeftToLive = 1;

      if (!prediction) {
        // Temporarily use floating text until spell animation is finished
        floatingText({ coords: unit, text: corpseDecayId });
        updateTooltip(unit);
      }
    }
  });
  registerEvents(corpseDecayId, {
    onTurnEnd: async (unit: Unit.IUnit, prediction: boolean, underworld: Underworld) => {
      const modifier = unit.modifiers[corpseDecayId];
      if (!prediction) {
        if (modifier) {
          // Decrement the turns left to live
          modifier.turnsLeftToLive -= 1;
          updateTooltip(unit);
          // Ensure the unit is still dead, don't remove resurrected unitsn
          if (!unit.alive) {
            if (modifier.turnsLeftToLive <= 0) {
              floatingText({
                coords: clone(unit), text: `corpse decayed`,
                style: { fill: colors.healthRed },
              });
              Unit.cleanup(unit, false);
            }
          } else {
            Unit.removeModifier(unit, corpseDecayId, underworld)
          }
        } else {
          console.error(`Should have ${corpseDecayId} modifier on unit but it is missing`);
        }
      }
      return;
    },
  });
}
export function updateTooltip(unit: Unit.IUnit) {
  if (unit.modifiers[corpseDecayId]) {
    // Set tooltip:
    unit.modifiers[corpseDecayId].tooltip = i18n(['turns until decay', unit.modifiers[corpseDecayId].turnsLeftToLive]);
  }
}
