import * as Unit from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';
import { UnitType } from '../commonTypes';
import * as config from '../config'

const id = 'freeze';
const spell: Spell = {
  card: {
    id,
    manaCost: 10,
    healthCost: 0,
    probability: 50,
    thumbnail: 'freeze.png',
    description: `
Freezes the target(s) for 1 turn, preventing them from moving or acting.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id);
        if (unit.unitType === UnitType.PLAYER_CONTROLLED) {
          const player = window.underworld.players.find(
            (p) => p.unit === unit,
          );
          if (player) {
            window.underworld.endPlayerTurn(player.clientId);
          }
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove
  },
  events: {
    onTurnStart: async (unit: Unit.IUnit) => {
      // Decrement how many turns left the unit is frozen
      unit.modifiers[id] && unit.modifiers[id].turnsLeft--;
      if (unit.modifiers[id] && unit.modifiers[id].turnsLeft <= 0) {
        Unit.removeModifier(unit, id);
      }
      // Ensure that the unit cannot move when frozen
      // (even when players' turns are ended they can still act so long
      // as it is underworld.turn_phase === turn_phase.PlayerTurns, this is because all players act simultaneously
      // during that phase, so setting distanceMovedThisTurn equal to the distance that they can move
      // prevents players from moving when they are frozen)
      // and then returning true also ends their turn.
      unit.distanceMovedThisTurn = unit.moveDistance;
      // Abort turn
      return true;
    },
  },
  subsprites: {
    freeze: {
      imageName: 'freeze.png',
      alpha: 1.0,
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 1,
        y: 1,
      },
    },
  },
};

function add(unit: Unit.IUnit) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.radius = config.COLLISION_MESH_RADIUS
    unit.modifiers[id] = { isCurse: true };
    // Add event
    unit.onTurnStartEvents.push(id);

    // Add subsprite image
    Image.addSubSprite(unit.image, id);
  }
  // Increment the number of turns that freeze is applied (can stack)
  unit.modifiers[id].turnsLeft = (unit.modifiers[id].turnsLeft || 0) + 1;
}
function remove(unit: Unit.IUnit) {
  if (unit.image.subSprites.includes('heavy_armor')) {
    unit.radius = config.UNIT_HEAVY_BASE_RADIUS;
  } else {
    unit.radius = config.UNIT_BASE_RADIUS
  }
}

export default spell;
