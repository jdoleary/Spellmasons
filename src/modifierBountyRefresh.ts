import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { bountyId, placeRandomBounty } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';

// Spawns a new bounty immediately when one is claimed
export const bountyPortalId = 'Bounty: Refresh';
export default function registerBountyPortal() {
  registerModifiers(bountyPortalId, {
    description: ('rune_bounty_refresh'),
    costPerUpgrade: 150,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyPortalId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addModifier(unit, bountyHunterId, underworld, prediction);
        Unit.addEvent(unit, bountyPortalId);
      });
    }
  });
  registerEvents(bountyPortalId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyPortalId];
      if (modifier) {
        if (killedUnit.modifiers[bountyId]) {
          placeRandomBounty(unit, underworld, prediction);
        }
      }
    }
  });
}