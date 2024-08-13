import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { bountyColor, getActiveBounties, placeRandomBounty } from "./modifierBounty";
import Underworld from './Underworld';

// This modifier should be applied in each other bounty modifier's add function
export const bountyHunterId = 'Bounty Hunter';
export default function registerBountyHunter() {
  registerModifiers(bountyHunterId, {
    description: ('rune_bounty_hunter'),
    keepBetweenLevels: true,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const modifier = getOrInitModifier(unit, bountyHunterId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, bountyHunterId);
      });

      placeRandomBounty(unit, underworld, prediction);
    }
  });
  registerEvents(bountyHunterId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyHunterId];
      if (modifier) {
        placeRandomBounty(unit, underworld, prediction);
      }
    },
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyHunterId];
      if (modifier) {
        // Get all units with a bounty
        const units = getActiveBounties(unit, underworld, prediction);
        if (units.length > 0) {
          // Draw a line to each
          const graphics = globalThis.selectedUnitGraphics;
          if (graphics) {
            for (let bountyUnit of units) {
              graphics.lineStyle(3, bountyColor, 0.7);
              graphics.moveTo(bountyUnit.x, bountyUnit.y);
              graphics.lineTo(unit.x, unit.y);
            }
          }
        }
      }
    }
  });
}