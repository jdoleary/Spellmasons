import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Image from '../graphics/Image';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const targetImmuneId = 'target_immune';
const subspriteId = 'targetImmune';
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  Image.addSubSprite(unit.image, subspriteId);
}
export default function registerTargetImmune() {
  registerModifiers(targetImmuneId, {
    description: 'target_immune_description',
    probability: 100,
    addModifierVisuals,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, targetImmuneId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, targetImmuneId);
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
