import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as Pickup from './entity/Pickup';
import { bountyId } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';

// Spawn a purple portal when claiming a bounty
export const bountyPortalId = 'Bounty: Portal';
export default function registerBountyPortal() {
  registerModifiers(bountyPortalId, {
    description: ('rune_bounty_portal'),
    costPerUpgrade: 320,
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
        // Create a purple portal on kill
        if (killedUnit.modifiers[bountyId]) {
          const portalPickupSource = Pickup.pickups.find(p => p.name == Pickup.PORTAL_PURPLE_NAME);
          if (portalPickupSource) {
            Pickup.create({ pos: killedUnit, pickupSource: portalPickupSource, logSource: 'Bounty Portal' }, underworld, prediction);
          } else {
            console.error(`Could not find purple portal pickup source for ${bountyPortalId}`)
          }
        }
      }
    }
  });
}