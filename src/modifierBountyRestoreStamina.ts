import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import { healUnit } from "./effects/heal";
import * as Unit from './entity/Unit';
import { bountyId } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';

export const bountyRestoreStaminaId = 'Bounty: Restore Stamina';
export default function registerBountyRestoreStamina() {
  registerModifiers(bountyRestoreStaminaId, {
    description: 'Restore [quantity] Stamina when claiming a bounty',
    costPerUpgrade: 20,
    quantityPerUpgrade: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyRestoreStaminaId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addModifier(unit, bountyHunterId, underworld, prediction);
        Unit.addEvent(unit, bountyRestoreStaminaId);
      });
    }
  });
  registerEvents(bountyRestoreStaminaId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyRestoreStaminaId];
      if (modifier) {
        // Only restore stamina if the killed unit has a bounty
        if (killedUnit.modifiers[bountyId]) {
          // Can't restore stamina above max
          const staminaToMax = unit.staminaMax - unit.stamina;
          unit.stamina += Math.min(modifier.quantity, Math.max(staminaToMax, 0));
        }
      }
    }
  });
}