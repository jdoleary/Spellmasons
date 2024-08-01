import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import { healManaUnit, healUnit } from "./effects/heal";
import * as Unit from './entity/Unit';
import { bountyId } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';

export const bountyRestoreManaId = 'Bounty: Restore Mana';
export default function registerBountyRestoreMana() {
  registerModifiers(bountyRestoreManaId, {
    description: 'Restore [quantity] Mana when claiming a bounty',
    costPerUpgrade: 30,
    quantityPerUpgrade: 10,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyRestoreManaId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addModifier(unit, bountyHunterId, underworld, prediction);
        Unit.addEvent(unit, bountyRestoreManaId);
      });
    }
  });
  registerEvents(bountyRestoreManaId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyRestoreManaId];
      if (modifier) {
        // Only restore mana if the killed unit has a bounty
        if (killedUnit.modifiers[bountyId]) {
          healManaUnit(unit, modifier.quantity, unit, underworld, prediction);
        }
      }
    }
  });
}