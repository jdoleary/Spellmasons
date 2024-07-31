import { registerEvents, registerModifiers } from "./cards";
import { animateMitosis, doCloneUnit } from "./cards/clone";
import { getOrInitModifier } from "./cards/util";
import * as Image from './graphics/Image';
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import Underworld from './Underworld';

export const slimeId = 'Slime';
const subspriteId = 'spell-effects/slime';
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  Image.addSubSprite(unit.image, subspriteId);
}
export default function registerSlime() {
  registerModifiers(slimeId, {
    description: 'Causes a unit to split into two units every turn.',
    probability: 100,
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
      floatingText({ coords: unit, text: slimeId, prediction });
      const modifier = unit.modifiers[slimeId];
      for (let i = 0; i < (modifier?.quantity || 1); i++) {
        const clone = doCloneUnit(unit, underworld, prediction);
        if (clone) {
          // Only the source unit maintains slimeId or else it gets exponential
          Unit.removeModifier(clone, slimeId, underworld)
        }
      }
    }
  });
}
