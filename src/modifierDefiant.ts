import { registerEvents, registerModifiers } from "./cards";
import { animateMitosis, doCloneUnit } from "./cards/clone";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import { distance } from "./jmath/math";
import { UnitSubType } from "./types/commonTypes";
import Underworld from './Underworld';

export const defiantId = 'Defiant';
const reductionProportion = 0.02;
export default function registerDefiant() {
  registerModifiers(defiantId, {
    description: `Each enemy within attack range reduces incoming damage by ${Math.floor(reductionProportion * 100)}%`,
    probability: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, defiantId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, defiantId);
      });
    },
  });
  registerEvents(defiantId, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      // Melee units have to consider maxStamina as part of their range or else this modifier would have virtually no effect
      const range = unit.unitSubType === UnitSubType.MELEE ? unit.staminaMax + unit.attackRange : unit.attackRange;
      // No effect if attackRange is 0
      // This is a special handled case for Pacified melee units
      // since Pacify (or other spells that affect attack range) lowers melee 
      // attackRange but not stamina and with an attack range of 0 no red circle appears
      // and since this modifier uses stamina + attack range, to be visually consistent
      // units with stamina but no attack range shouldn't benefit from this modifier
      if (unit.attackRange === 0) {
        return amount;
      }
      const nearbyAllies = underworld.units.filter(u => u.faction !== unit.faction && distance(u, unit) <= range)
      const reductionAmount = (nearbyAllies.length * reductionProportion)
      // Cannot be below 0 (must still be damage, not healing)
      const overriddenAmount = Math.max(0, Math.floor(amount - amount * reductionAmount));
      floatingText({ coords: unit, text: `${defiantId}: Damage reduced by ${Math.floor(reductionAmount * 100)}%`, prediction });
      return overriddenAmount;
    }
  });
}
