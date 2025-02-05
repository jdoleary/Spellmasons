import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Image from '../graphics/Image';
import * as Unit from '../entity/Unit';
import floatingText from "../graphics/FloatingText";
import Underworld from '../Underworld';

export const damagelimiterId = 'Damage Limiter';
const limit = 30;
const subspriteId = 'damage-limiter';
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  Image.addSubSprite(unit.image, subspriteId);
}
export default function registerDamageLimiter() {
  registerModifiers(damagelimiterId, {
    description: ['damage_limiter_description', limit.toString()],
    stage: "Amount Override",
    probability: 50,
    addModifierVisuals,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, damagelimiterId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, damagelimiterId);
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
        x: 0.25,
        y: 0.25,
      },
    },
  });
  registerEvents(damagelimiterId, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const overriddenAmount = Math.min(limit, amount);
      if (overriddenAmount < amount) {
        floatingText({ coords: unit, text: `${damagelimiterId}`, prediction })
      }
      return overriddenAmount;
    }
  });
}
