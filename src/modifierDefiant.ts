import { registerEvents, registerModifiers } from "./cards";
import { animateMitosis, doCloneUnit } from "./cards/clone";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import { distance, lerp } from "./jmath/math";
import { UnitSubType } from "./types/commonTypes";
import Underworld from './Underworld';
import * as Image from './graphics/Image';
import { lerpVec2 } from "./jmath/Vec";

export const defiantId = 'Defiant';
// const reductionProportion = 0.02;
// Dev test
const reductionProportion = 0.5;

const maxReductionProportion = 0.5;
const subspriteImageName = 'spell-effects/shield-red.png';
export default function registerDefiant() {
  registerModifiers(defiantId, {
    description: `Each enemy within attack range reduces incoming damage by ${Math.floor(reductionProportion * 100)}%`,
    probability: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, defiantId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, defiantId);
      });
    },
    addModifierVisuals: (unit: Unit.IUnit, underworld: Underworld) => {
      Image.addSubSprite(unit.image, subspriteImageName);
    },
    subsprite: {
      imageName: subspriteImageName,
      alpha: 0.9,
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  });
  registerEvents(defiantId, {
    onGameLoop: (unit: Unit.IUnit, underworld: Underworld) => {
      if (unit.image) {
        const modifier = unit.modifiers[defiantId];
        // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
        // which is used for identifying the sprite or animation that is currently active
        const subspriteShield = unit.image.sprite.children.find(s => s.imagePath == subspriteImageName);
        if (subspriteShield) {
          const reductionProportion = getReductionProportion(unit, underworld);
          const lerpAmount = reductionProportion / maxReductionProportion;
          const displayTarget = {
            scale: lerpVec2({ x: 0.2, y: 0.2 }, { x: 0.5, y: 0.5 }, lerpAmount),
            x: lerp(-16, 0, lerpAmount),
            y: lerp(-16, 0, lerpAmount)
          }
          if (modifier) {
            modifier.displayTarget = displayTarget;
          }
          // Animate shield towards displayTarget of the shield smoothly
          if (modifier && modifier.displayTarget) {
            const animationSpeed = 0.05;
            subspriteShield.scale = lerpVec2(subspriteShield.scale, modifier.displayTarget.scale, animationSpeed);
            subspriteShield.x = lerp(subspriteShield.x, modifier.displayTarget.x, animationSpeed);
            subspriteShield.y = lerp(subspriteShield.x, modifier.displayTarget.y, animationSpeed);
          }

        }
      }

    },
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const reductionAmount = getReductionProportion(unit, underworld);
      // No effect if attackRange is 0
      // This is a special handled case for Pacified melee units
      // since Pacify (or other spells that affect attack range) lowers melee 
      // attackRange but not stamina and with an attack range of 0 no red circle appears
      // and since this modifier uses stamina + attack range, to be visually consistent
      // units with stamina but no attack range shouldn't benefit from this modifier
      if (unit.attackRange === 0) {
        return amount;
      }
      // Cannot be below 0 (must still be damage, not healing)
      const overriddenAmount = Math.max(0, Math.floor(amount - amount * reductionAmount));
      floatingText({ coords: unit, text: `${defiantId}: Damage reduced by ${Math.floor(reductionAmount * 100)}%`, prediction });
      return overriddenAmount;
    }
  });
}
// Returns 0.0 to maxReductionProportion 
function getReductionProportion(unit: Unit.IUnit, underworld: Underworld): number {
  // Melee units have to consider maxStamina as part of their range or else this modifier would have virtually no effect
  const range = unit.unitSubType === UnitSubType.MELEE ? unit.staminaMax + unit.attackRange : unit.attackRange;
  const nearbyAllies = underworld.units.filter(u => u.faction !== unit.faction && distance(u, unit) <= range);
  const reductionAmount = (nearbyAllies.length * reductionProportion);
  return Math.min(maxReductionProportion, reductionAmount);
}
