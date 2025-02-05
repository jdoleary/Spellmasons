import seedrandom from "seedrandom";
import { registerEvents, registerModifiers } from "../cards";
import { animateMitosis, doCloneUnit } from "../cards/clone";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import floatingText from "../graphics/FloatingText";
import { equal, Vec2 } from "../jmath/Vec";
import Underworld from '../Underworld';
import * as config from '../config';

export const cloneOnTeleportId = 'Changeling';
export default function registerContaminateSelfOnTeleport() {
  registerModifiers(cloneOnTeleportId, {
    description: ('rune_clone_on_tele'),
    _costPerUpgrade: 300,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, cloneOnTeleportId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, cloneOnTeleportId);
      });
    }
  });
  registerEvents(cloneOnTeleportId, {
    onTeleport: (unit: Unit.IUnit, originalLocation: Vec2, underworld: Underworld, prediction: boolean) => {
      if (equal(unit, originalLocation)) {
        // Prevent stacking teleport to spawn a bunch of copies
        return;
      }
      const modifier = unit.modifiers[cloneOnTeleportId];
      if (modifier) {
        const validSpawnCoords = underworld.findValidSpawns({ spawnSource: unit, ringLimit: 5, prediction, radius: config.spawnSize }, { allowLiquid: unit.inLiquid });
        for (let i = 0; i < modifier.quantity; i++) {
          const clone = doCloneUnit(unit, underworld, prediction, unit, validSpawnCoords[i]);
          // Attempt to put the Changling where the player was, but in the event
          // that the player is swapping that location might now be full
          let coords = originalLocation;
          if (!underworld.isPointValidSpawn(coords, prediction, { allowLiquid: true })) {
            coords = underworld.DEPRECIATED_findValidSpawnInRadius(originalLocation, prediction) || coords;
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

