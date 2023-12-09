import { registerModifiers } from './index';
import * as Image from '../graphics/Image';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { getOrInitModifier } from './util';
import { Vec2, equal } from '../jmath/Vec';
import floatingText from '../graphics/FloatingText';
import type { Sprite } from 'pixi.js';

export const id = 'Immune';
export default function registerImmune() {
  registerModifiers(id, {
    init,
    add,
    remove,
  });
}
const imageName = 'spell-effects/modifierShield.png';
export function init(
  unit: Unit.IUnit,
  underworld: Underworld,
  prediction: boolean,
) {
  // Add subsprite image
  // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
  // which is used for identifying the sprite or animation that is currently active
  const animatedSprite = unit.image?.sprite.children.find(c => c.imagePath == imageName)
    || Image.addSubSprite(unit.image, imageName);
  if (animatedSprite) {
    // Make it red
    (animatedSprite as Sprite).tint = 0xff0000;
  }
}
export function add(
  unit: Unit.IUnit,
  underworld: Underworld,
  prediction: boolean,
  quantity: number = 1,
) {
  getOrInitModifier(
    unit,
    id,
    { isCurse: false, quantity, persistBetweenLevels: false },
    () => {
      init(unit, underworld, prediction);
    },
  );
}
export function remove(unit: Unit.IUnit, underworld: Underworld) {
  Image.removeSubSprite(unit.image, imageName);
}

let notified: Vec2[] = [];
export function resetNotifiedImmune() {
  notified = [];
}

export const notifyImmune = (coords: Vec2, prediction: boolean) => {
  if (!notified.find((x) => equal(coords, x))) {
    floatingText({ coords, text: 'Immune' });
    notified.push(coords);
  }
};
