import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Image from './graphics/Image';
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import floatingText from "./graphics/FloatingText";

export const growthId = 'Growth';
// TODO EFFECT
// const subspriteId = 'spell-effects/growth';
// function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
//   Image.addSubSprite(unit.image, subspriteId);
// }
export default function registerGrowth() {
  registerModifiers(growthId, {
    description: 'Unit gets stronger every turn.',
    probability: 100,
    // addModifierVisuals,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, growthId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, growthId);
      });
    },
    // subsprite: {
    //   imageName: subspriteId,
    //   alpha: 1.0,
    //   anchor: {
    //     x: 0.5,
    //     y: 0.5,
    //   },
    //   scale: {
    //     x: 1.0,
    //     y: 1.2,
    //   },
    // },
  });

  registerEvents(growthId, {
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      floatingText({ coords: unit, text: growthId, prediction });
      unit.strength++;
      Image.setScaleFromModifiers(unit.image, unit.strength);
      unit.healthMax = Math.round(unit.healthMax * 1.25)
      unit.health = Math.round(unit.health * 1.25)
      unit.damage = Math.round(unit.damage * 1.25)

    }
  });
}
