import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import * as colors from '../graphics/ui/colors';
import floatingText from "../graphics/FloatingText";
import { clone } from "../jmath/Vec";
import { UnitType } from "../types/commonTypes";

export const corpseDecayId = 'Corpse Decay';
export default function registerCorpseDecay() {
  registerModifiers(corpseDecayId, {
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      // Never add this modifier to a player or living unit
      if (unit.unitType == UnitType.PLAYER_CONTROLLED || unit.alive) return;

      const modifier = getOrInitModifier(unit, corpseDecayId, { isCurse: true, quantity }, () => {
        Unit.addEvent(unit, corpseDecayId);
      });
      modifier.turnsLeftToLive = 1;

      if (!prediction) {
        // Temporarily use floating text until spell animation is finished
        floatingText({ coords: unit, text: corpseDecayId });
      }
    }
  });
  registerEvents(corpseDecayId, {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[corpseDecayId];
      if (modifier) {
        // Set tooltip:
        modifier.tooltip = i18n(['turns until decay', modifier.turnsLeftToLive]);
      }
    },
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[corpseDecayId];
      if (!prediction) {
        if (modifier) {
          // Decrement the turns left to live
          modifier.turnsLeftToLive -= 1;
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