import { registerEvents, registerModifiers } from "./cards";
import { contaminate } from "./cards/contaminate";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import { Vec2 } from "./jmath/Vec";
import { modifierBaseRadiusBoostId } from "./modifierBaseRadiusBoost";
import Underworld from './Underworld';

export const contaminateselfonteleportId = 'Contaminate Self On Teleport';
export default function registerContaminateSelfOnTeleport() {
  registerModifiers(contaminateselfonteleportId, {
    description: ('rune_contaminate_on_tele'),
    costPerUpgrade: 120,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, contaminateselfonteleportId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, contaminateselfonteleportId);
      });
    }
  });
  registerEvents(contaminateselfonteleportId, {
    onTeleport: (unit: Unit.IUnit, newLocation: Vec2, underworld: Underworld, prediction: boolean) => {
      const player = underworld.players.find(p => p.unit == unit);
      contaminate(player, unit, 1, unit.modifiers[modifierBaseRadiusBoostId]?.quantity || 0, underworld, prediction);
      if (Object.values(unit.modifiers).filter(x => x.isCurse).length) {
        floatingText({ coords: newLocation, text: "Contaminate on Teleport", prediction })
      }
    }
  });
}

