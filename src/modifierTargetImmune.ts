import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Image from './graphics/Image';
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const targetImmuneId = 'Target Immune';
const subspriteId = 'spell-effects/targetImmune';
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  Image.addSubSprite(unit.image, subspriteId);
}
export default function registerTargetImmune() {
  registerModifiers(targetImmuneId, {
    description: 'Unit resists targeting unless targeted directly.',
    addModifierVisuals,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, targetImmuneId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, targetImmuneId);
        addModifierVisuals(unit, underworld, prediction);
      });
    },
    subsprite: {
      imageName: subspriteId,
      alpha: 1.0,
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 1.0,
        y: 1.2,
      },
    },
  });
}
