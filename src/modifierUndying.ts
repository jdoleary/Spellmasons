import { registerEvents, registerModifiers } from "./cards";
import { resurrect_id } from "./cards/resurrect";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { summoningSicknessId } from "./modifierSummoningSickness";
import Underworld from './Underworld';

// A modifier that makes a unit resurrect during its next onTurnStart()
export const undyingModifierId = 'undying';
export default function registerUndying() {
  registerModifiers(undyingModifierId, {
    add: (unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, undyingModifierId, { isCurse: false, quantity, keepOnDeath: true }, () => {
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
        // https://github.com/jdoleary/Spellmasons/pull/641
        // TODO - Cast cards needs an optional parameter to cast without spending mana/health/etc.
        // Should apply to poisoner/priest/etc. as well
        const { targetedUnits } = await underworld.castCards({
          casterCardUsage: {},
          casterUnit: unit,
          casterPositionAtTimeOfCast: unit,
          cardIds: [resurrect_id],
          castLocation: unit,
          prediction: prediction,
          outOfRange: false,
        });
        for (let unit of targetedUnits) {
          // Add summoning sickeness so they can't act after they are summoned
          Unit.addModifier(unit, summoningSicknessId, underworld, false);
        }

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
