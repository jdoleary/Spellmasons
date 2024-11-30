import { registerEvents, registerModifiers } from "./cards";
import { contaminate } from "./cards/contaminate";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import { Vec2 } from "./jmath/Vec";
import { modifierBaseRadiusBoostId } from "./modifierBaseRadiusBoost";
import Underworld from './Underworld';

export const contaminateOnKill = 'Contaminate On Kill';
export default function registerContaminateSelfOnTeleport() {
  registerModifiers(contaminateOnKill, {
    description: ('rune_contaminate_on_kill'),
    _costPerUpgrade: 120,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, contaminateOnKill, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, contaminateOnKill);
      });
    }
  });
  registerEvents(contaminateOnKill, {
    onKill: async (killer: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const player = underworld.players.find(p => p.unit == killer);
      contaminate(player, killedUnit, 1, killer.modifiers[modifierBaseRadiusBoostId]?.quantity || 0, underworld, prediction);
      if (Object.values(killedUnit.modifiers).filter(x => x.isCurse).length) {
        floatingText({ coords: killedUnit, text: "Contaminate on Kill", prediction })
      }
    }
  });
}

