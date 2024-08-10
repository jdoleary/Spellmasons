import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { bountyId } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';

// Claiming a bounty fully restores stamina
export const bountyRestoreStaminaId = 'Bounty: Restore Stamina';
export default function registerBountyRestoreStamina() {
  registerModifiers(bountyRestoreStaminaId, {
    description: ('rune_bounty_restore_stamina'),
    costPerUpgrade: 80,
    maxUpgradeCount: 1,
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
          unit.stamina = unit.staminaMax;
        }
      }
    }
  });
}