import { registerEvents, registerModifiers } from "./cards";
import { resurrect_id } from "./cards/resurrect";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as config from './config';
import { summoningSicknessId } from "./modifierSummoningSickness";
import Underworld from './Underworld';
import floatingText from "./graphics/FloatingText";
import { UnitType } from "./types/commonTypes";

// A modifier that makes a unit resurrect during its next onTurnStart()
export const undyingModifierId = 'undying';
export default function registerUndying() {
  registerModifiers(undyingModifierId, {
    probability: 5,
    description: 'undying_description',
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, undyingModifierId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, undyingModifierId);
      });
    },
  });
  registerEvents(undyingModifierId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (!unit.alive) {
        if (!prediction) {
          floatingText({
            coords: unit,
            text: i18n(`Undying`),
            style: { fill: 'white', ...config.PIXI_TEXT_DROP_SHADOW }
          });
        }
        Unit.removeModifier(unit, undyingModifierId, underworld);
        const { targetedUnits } = await underworld.castCards({
          casterCardUsage: {},
          casterUnit: unit,
          casterPositionAtTimeOfCast: unit,
          cardIds: [resurrect_id],
          castLocation: unit,
          initialTargetedUnitId: unit.id,
          prediction: prediction,
          outOfRange: false,
          castForFree: true,
        });
        for (let unit of targetedUnits) {
          unit.health = Math.floor(unit.healthMax / 2);
          if (unit.unitType != UnitType.PLAYER_CONTROLLED) {
            // Add summoning sickeness to AI so they can't act after they are summoned
            Unit.addModifier(unit, summoningSicknessId, underworld, false);
          }
        }

      }
    }
  });
}
