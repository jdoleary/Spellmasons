import { registerEvents, registerModifiers } from "./cards";
import { contaminate } from "./cards/contaminate";
import { enfeebleFilter, enfeebleId } from "./cards/enfeeble";
import { getOrInitModifier } from "./cards/util";
import { BLUE_PORTAL, pickups } from "./entity/Pickup";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import { drawUICirclePrediction } from "./graphics/PlanningView";
import { healthRed } from "./graphics/ui/colors";
import { distance } from "./jmath/math";
import { chooseObjectWithProbability, getUniqueSeedString, seedrandom } from "./jmath/rand";
import { Vec2 } from "./jmath/Vec";
import { modifierBaseRadiusBoostId } from "./modifierBaseRadiusBoost";
import Underworld from './Underworld';

export const townPortalId = 'Town Portal';
export default function registerContaminateSelfOnTeleport() {
  registerModifiers(townPortalId, {
    description: ('rune_town_portal'),
    unitOfMeasure: '%',
    _costPerUpgrade: 70,
    quantityPerUpgrade: 10,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, townPortalId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, townPortalId);
      });
    }
  });
  registerEvents(townPortalId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[townPortalId];
      if (modifier) {
        const seed = seedrandom(getUniqueSeedString(underworld) + `-${killedUnit.id}`);
        const use = chooseObjectWithProbability([{ use: true, probability: modifier.quantity }, { use: false, probability: 100 - modifier.quantity }], seed)?.use || false;
        if (use) {
          const pickup = underworld.spawnPickup(pickups.findIndex(p => p.name == BLUE_PORTAL), killedUnit, prediction);
          if (!prediction) {
            floatingText({ coords: killedUnit, text: townPortalId, prediction })
          }
        }
      }
    }
  });
}
