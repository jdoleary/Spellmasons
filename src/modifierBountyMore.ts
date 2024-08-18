import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { placeRandomBounty } from "./modifierBounty";
import Underworld from './Underworld';

// This modifier should be applied in each other bounty modifier's add function
export const moreBountiesId = 'More Bounties';
export default function registerBountyHunter() {
  registerModifiers(moreBountiesId, {
    description: ('rune_more_bounties'),
    maxUpgradeCount: 3,
    _costPerUpgrade: 40,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      // Keep track of the count
      const modifier = getOrInitModifier(unit, moreBountiesId, { isCurse: false, quantity, keepOnDeath: true }, () => {
      });

      placeRandomBounty(unit, underworld, prediction);
    }
  });
}