import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as config from './config';
import floatingText from "./graphics/FloatingText";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';
import { skyBeam } from "./VisualEffects";
import { chooseOneOfSeeded, getUniqueSeedString } from "./jmath/rand";
import { UnitSubType } from "./types/commonTypes";
import seedrandom from "seedrandom";
import * as Image from './graphics/Image';
import { moreBountiesId } from "./modifierBountyMore";

export const bountyId = 'Bounty';
export const bountyColor = 0xffdc64;
const subspriteImageName = 'coin';
export default function registerBounty() {
  registerModifiers(bountyId, {
    description: ('rune_bounty'),
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyId, { isCurse: false, quantity, keepOnDeath: false }, () => {
        Unit.addEvent(unit, bountyId);
      });

      if (!prediction) {
        // Draw attention to the bounty being added
        skyBeam(unit);
        floatingText({
          coords: unit,
          text: 'Bounty!',
          style: {
            fill: 'yellow',
            ...config.PIXI_TEXT_DROP_SHADOW
          },
        });
      }
    },
    addModifierVisuals: (unit: Unit.IUnit, underworld: Underworld) => {
      Image.addSubSprite(unit.image, subspriteImageName);
    },
    subsprite: {
      imageName: subspriteImageName,
      alpha: 1.0,
      anchor: {
        x: 1.5,
        y: 2,
      },
      scale: {
        x: 0.4,
        y: 0.4,
      },
    },
  });
  registerEvents(bountyId, {
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyId];
      if (modifier) {
        // Get all units with bountyHunter
        let units = prediction ? underworld.unitsPrediction : underworld.units;
        units = units.filter(u => u.modifiers[bountyHunterId]);

        if (units.length > 0) {
          // Draw a line to each
          const graphics = globalThis.selectedUnitGraphics;
          if (graphics) {
            for (let hunterUnit of units) {
              graphics.lineStyle(3, bountyColor, 0.7);
              graphics.moveTo(hunterUnit.x, hunterUnit.y);
              graphics.lineTo(unit.x, unit.y);
            }
          }
        }
      }
    }
  });
}

export function placeRandomBounty(bountyHunter: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;

  // Get existing bounty targets
  const activeBounties = getActiveBounties(bountyHunter, underworld, prediction);
  // Max bounties = number of bounty hunters on team
  const maxBounties = underworld.players.reduce((acc, p) => {
    const isBountyHunter = p.unit.faction == bountyHunter.faction && p.unit.modifiers[bountyHunterId];
    if (isBountyHunter) {
      return acc + (p.unit.modifiers[moreBountiesId]?.quantity || 0) + 1;
    } else {
      return acc;
    }
  }, 0);
  for (let i = 0; i < maxBounties - activeBounties.length; i++) {
    // Find a random enemy unit and give it a bounty
    // Unit must be alive, in enemy faction, not a doodad, and not yet have a bounty
    units = units.filter(u => u.alive && (u.faction != bountyHunter.faction) && (u.unitSubType != UnitSubType.DOODAD) && !u.modifiers[bountyId] && !u.flaggedForRemoval);
    if (units.length > 0) {
      const random = seedrandom(`${getUniqueSeedString(underworld)} - ${bountyHunter.id}`);
      const chosenUnit = chooseOneOfSeeded(units, random);
      if (chosenUnit) {
        Unit.addModifier(chosenUnit, bountyId, underworld, prediction);
      }
    }
  }
}

export function getActiveBounties(bountyHunter: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;
  // returns all living bounty targets in enemy faction
  units = units.filter(u => u.alive && u.faction != bountyHunter.faction && u.modifiers[bountyId] && !u.flaggedForRemoval);
  return units;
}