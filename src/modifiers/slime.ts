import { registerEvents, registerModifiers } from "../cards";
import { animateMitosis, doCloneUnit } from "../cards/clone";
import { getOrInitModifier } from "../cards/util";
import * as Image from '../graphics/Image';
import * as Unit from '../entity/Unit';
import floatingText from "../graphics/FloatingText";
import Underworld from '../Underworld';
import * as config from '../config';

export const slimeId = 'Slime';
const subspriteId = 'slime';
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  Image.addSubSprite(unit.image, subspriteId);
}
export default function registerSlime() {
  registerModifiers(slimeId, {
    description: 'slime_description',
    probability: 100,
    unavailableUntilLevelIndex: 9,
    addModifierVisuals,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, slimeId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, slimeId);
      });
    },
    subsprite: {
      imageName: subspriteId,
      alpha: 0.95,
      anchor: {
        x: 0.5,
        y: 0,
      },
      scale: {
        x: 0.6,
        y: 0.6,
      },
    },
  });
  registerEvents(slimeId, {
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (!unit.alive) {
        return;
      }
      await animateMitosis(unit.image);
      const validSpawnCoords = underworld.findValidSpawns({ spawnSource: unit, ringLimit: 5, prediction, radius: config.spawnSize }, { allowLiquid: unit.inLiquid });
      const clone = doCloneUnit(unit, underworld, prediction, unit, validSpawnCoords[0]);
      if (clone) {
        floatingText({ coords: unit, text: slimeId, prediction });
        // Only the source unit maintains slimeId or else it gets exponential
        Unit.removeModifier(clone, slimeId, underworld)
      }
    }
  });
}
