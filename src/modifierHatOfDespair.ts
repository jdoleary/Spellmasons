import { registerEvents, registerModifiers } from "./cards";
import { contaminate } from "./cards/contaminate";
import { enfeebleFilter, enfeebleId } from "./cards/enfeeble";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import { drawUICirclePrediction } from "./graphics/PlanningView";
import { healthRed } from "./graphics/ui/colors";
import { distance } from "./jmath/math";
import { Vec2 } from "./jmath/Vec";
import { modifierBaseRadiusBoostId } from "./modifierBaseRadiusBoost";
import Underworld from './Underworld';

export const baseRadius = 140;
export const hatOfDespair = 'Hat of Despair';
export default function registerContaminateSelfOnTeleport() {
  registerModifiers(hatOfDespair, {
    description: ('rune_hat_of_despair'),
    _costPerUpgrade: 100,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, hatOfDespair, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, hatOfDespair);
      });
    }
  });
  registerEvents(hatOfDespair, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[hatOfDespair];
      const radius = getAdjustedRadius(unit.modifiers[modifierBaseRadiusBoostId]?.quantity || 0);
      const nearbyUnits = underworld.getAllUnits(prediction).filter(u => u !== killedUnit && u.alive && distance(u, killedUnit) <= radius).filter(enfeebleFilter);
      if (prediction) {
        drawUICirclePrediction(killedUnit, radius, healthRed, hatOfDespair);
      }
      for (let u of nearbyUnits) {
        Unit.addModifier(u, enfeebleId, underworld, prediction, modifier?.quantity || 1);
      }
      floatingText({ coords: killedUnit, text: hatOfDespair, prediction })
    }
  });
}
function getAdjustedRadius(radiusBoost: number = 0) {
  // +50% radius per radius boost
  return baseRadius * (1 + (0.5 * radiusBoost));
}
