import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Image from '../graphics/Image';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const doubledamageId = 'DoubleDamage';
const subspriteId = 'spellCleave';
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  Image.addSubSprite(unit.image, subspriteId);
}
export default function registerDoubleDamage() {
  registerModifiers(doubledamageId, {
    description: 'doubledamage_description',
    probability: 100,
    addModifierVisuals,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, doubledamageId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        unit.damage *= 2;
      });
    },
    remove: (unit: Unit.IUnit, underworld: Underworld) => {
      unit.damage = unit.damage / 2;
      unit.damage = Math.floor(unit.damage);
    },
    subsprite: {
      imageName: subspriteId,
      alpha: 1.0,
      anchor: {
        x: 0.75,
        y: 0.75,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  });
}