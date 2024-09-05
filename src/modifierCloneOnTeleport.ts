import seedrandom from "seedrandom";
import { registerEvents, registerModifiers } from "./cards";
import { animateMitosis, doCloneUnit } from "./cards/clone";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import { Vec2 } from "./jmath/Vec";
import Underworld from './Underworld';

export const cloneOnTeleportId = 'Changeling';
export default function registerContaminateSelfOnTeleport() {
  registerModifiers(cloneOnTeleportId, {
    description: ('rune_clone_on_tele'),
    _costPerUpgrade: 300,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, cloneOnTeleportId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, cloneOnTeleportId);
      });
    }
  });
  registerEvents(cloneOnTeleportId, {
    onTeleport: (unit: Unit.IUnit, originalLocation: Vec2, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[cloneOnTeleportId];
      if (modifier) {
        for (let i = 0; i < modifier.quantity; i++) {
          const clone = doCloneUnit(unit, underworld, prediction, unit);
          // Attempt to put the Changling where the player was, but in the event
          // that the player is swapping that location might now be full
          let coords = originalLocation;
          if (!underworld.isPointValidSpawn(coords, prediction, { allowLiquid: true })) {
            coords = underworld.findValidSpawnInRadius(originalLocation, prediction, seedrandom(`${unit.id}`)) || coords;
          }

          if (clone && coords) {
            clone.x = coords.x;
            clone.y = coords.y;
            clone.name = 'Changeling';
            // Wait a bit for floating text otherwise it gets covered by sky beam
            setTimeout(() => {
              floatingText({ coords: clone, text: cloneOnTeleportId, prediction });
            }, 250)
          }
        }
      } else {
        console.error(`Expected to find ${cloneOnTeleportId} modifier`)
      }
    }
  });
}

