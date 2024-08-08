import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import { distance } from "./jmath/math";
import { UnitSubType } from "./types/commonTypes";
import Underworld from './Underworld';
import * as Image from './graphics/Image';

export const defianceId = 'Defiance';
const reductionProportion = 0.02;
const maxReductionProportion = 0.5;
const subspriteImageName = 'spell-effects/shield-red.png';
export default function registerdefiance() {
  registerModifiers(defianceId, {
    description: `Each enemy within attack range reduces incoming damage by ${Math.floor(reductionProportion * 100)}%`,
    stage: "Amount Multiplier",
    probability: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, defianceId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, defianceId);
      });
    },
    addModifierVisuals: (unit: Unit.IUnit, underworld: Underworld) => {
      Image.addSubSprite(unit.image, subspriteImageName);
    },
    subsprite: {
      imageName: subspriteImageName,
      alpha: 0.9,
      anchor: {
        x: 1.5,
        y: 1.5,
      },
      scale: {
        x: 0.2,
        y: 0.2,
      },
    },
  });
  registerEvents(defianceId, {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[defianceId];
      if (modifier) {
        modifier.tooltip = `${defianceId}: ${Math.floor(getReductionProportion(unit, underworld) * 100)}% ${i18n('Damage Reduction')}`;
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
      floatingText({ coords: unit, text: `${defianceId}: Damage reduced by ${Math.floor(reductionAmount * 100)}%`, prediction });
      return overriddenAmount;
    }
  });
}
// Returns 0.0 to maxReductionProportion 
function getReductionProportion(unit: Unit.IUnit, underworld: Underworld): number {
  // Melee units have to consider maxStamina as part of their range or else this modifier would have virtually no effect
  const range = unit.unitSubType === UnitSubType.MELEE ? unit.staminaMax + unit.attackRange : unit.attackRange;
  const nearbyEnemies = underworld.units.filter(u => u.faction !== unit.faction && distance(u, unit) <= range);
  const reductionAmount = (nearbyEnemies.length * reductionProportion);
  return Math.min(maxReductionProportion, reductionAmount);
}
