import { registerEvents, registerModifiers } from "./cards";
import { suffocateCardId } from "./cards/suffocate";
import { getOrInitModifier } from "./cards/util";
import { healUnit } from "./effects/heal";
import * as Unit from './entity/Unit';
import { bountyId } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';

// Damaging a bounty target inflicts [quantity] suffocate
export const bountyDamageId = 'Bounty: Suffocate';
export default function registerBountySuffocate() {
  registerModifiers(bountyDamageId, {
    description: ('rune_bounty_suffocate'),
    unitOfMeasure: 'Suffocate',
    costPerUpgrade: 80,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyDamageId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addModifier(unit, bountyHunterId, underworld, prediction);
        Unit.addEvent(unit, bountyDamageId);
      });
    }
  });
  registerEvents(bountyDamageId, {
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      const modifier = damageDealer.modifiers[bountyDamageId];
      if (modifier) {
        // Only inflict suffocate against bounty targets
        if (damageReciever && damageReciever.modifiers[bountyId]) {
          Unit.addModifier(damageReciever, suffocateCardId, underworld, prediction, modifier.quantity, { sourceUnitId: damageDealer.id })
        }
      }

      return amount;
    }
  });
}