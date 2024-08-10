import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { bountyId, placeRandomBounty } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';

// Spawns a new bounty immediately when one is claimed
export const bountyRefreshId = 'Bounty: Refresh';
export default function registerBountyRefresh() {
  registerModifiers(bountyRefreshId, {
    description: ('rune_bounty_refresh'),
    costPerUpgrade: 120,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyRefreshId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addModifier(unit, bountyHunterId, underworld, prediction);
        Unit.addEvent(unit, bountyRefreshId);
      });
    }
  });
  registerEvents(bountyRefreshId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyRefreshId];
      if (modifier) {
        if (killedUnit.modifiers[bountyId]) {
          // This ignores the max bounty limit because the bounty modifier
          // cannot be removed from the killed unit yet
          placeRandomBounty(unit, underworld, prediction, true);
        }
      }
    }
  });
}