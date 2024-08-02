import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import { healUnit } from "./effects/heal";
import * as Unit from './entity/Unit';
import { bountyId } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';

export const bountyRestoreHealthId = 'Bounty: Restore Health';
export default function registerBountyRestoreHealth() {
  registerModifiers(bountyRestoreHealthId, {
    description: ('rune_bounty_restore_health'),
    unitOfMeasure: 'Health',
    costPerUpgrade: 30,
    quantityPerUpgrade: 20,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyRestoreHealthId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addModifier(unit, bountyHunterId, underworld, prediction);
        Unit.addEvent(unit, bountyRestoreHealthId);
      });
    }
  });
  registerEvents(bountyRestoreHealthId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyRestoreHealthId];
      if (modifier) {
        // Only restore health if the killed unit has a bounty
        if (killedUnit.modifiers[bountyId]) {
          healUnit(unit, modifier.quantity, unit, underworld, prediction)
        }
      }
    }
  });
}