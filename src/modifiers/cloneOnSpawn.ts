import { registerEvents, registerModifiers } from "../cards";
import { animateMitosis, doCloneUnit } from "../cards/clone";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import floatingText from "../graphics/FloatingText";
import Underworld from '../Underworld';
import * as config from '../config';

export const cloneOnSpawnId = 'Clone on Spawn';
export default function registerCloneOnSpawn() {
  registerModifiers(cloneOnSpawnId, {
    description: ('rune_clone_on_spawn'),
    _costPerUpgrade: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, cloneOnSpawnId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, cloneOnSpawnId);
      });
    }
  });
  registerEvents(cloneOnSpawnId, {
    onSpawn: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[cloneOnSpawnId];
      if (modifier) {
        const validSpawnCoords = underworld.findValidSpawns({ spawnSource: unit, ringLimit: 5, prediction, radius: config.spawnSize }, { allowLiquid: unit.inLiquid });
        for (let i = 0; i < modifier.quantity; i++) {
          doCloneUnit(unit, underworld, prediction, unit, validSpawnCoords[i]);
        }
        // Wait a bit for floating text otherwise it gets covered by sky beam
        setTimeout(() => {
          floatingText({ coords: unit, text: cloneOnSpawnId, prediction });
        }, 500)
      } else {
        console.error(`Expected to find ${cloneOnSpawnId} modifier`)
      }
    }
  });
}

