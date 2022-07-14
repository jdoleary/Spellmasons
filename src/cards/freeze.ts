import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import type { Spell } from '.';
import { UnitType } from '../types/commonTypes';
import * as config from '../config'

const id = 'freeze';
const imageName = 'freeze.png';
const spell: Spell = {
  card: {
    id,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 2,
    probability: 50,
    thumbnail: 'spell_effects/spellFreeze_9.png',
    animationPath: 'spell-effects/spellFreeze',
    description: `
Freezes the target(s) for 1 turn, preventing them from moving or acting.
    `,
    effect: async (state, prediction) => {
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
    remove,
    subsprite: {
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
  events: {
    onTurnStart: async (unit: Unit.IUnit) => {
      // Ensure that the unit cannot move when frozen
      // (even when players' turns are ended they can still act so long
      // as it is underworld.turn_phase === turn_phase.PlayerTurns, this is because all players act simultaneously
      // during that phase, so setting stamina to 0
      // prevents players from moving when they are frozen)
      // and then returning true also ends their turn.
      unit.stamina = 0;
      // Skip turn
      return true;
    },
    onTurnEnd: async (unit: Unit.IUnit) => {
      // Decrement how many turns left the unit is frozen
      const modifier = unit.modifiers[id];
      if (modifier) {
        modifier.turnsLeft--;
        if (modifier.turnsLeft <= 0) {
          Unit.removeModifier(unit, id);
        }
      }
    },
  },

};

function add(unit: Unit.IUnit) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.radius = config.COLLISION_MESH_RADIUS
    unit.modifiers[id] = { isCurse: true };
    // Add event
    if (!unit.onTurnStartEvents.includes(id)) {
      unit.onTurnStartEvents.push(id);
    }
    if (!unit.onTurnEndEvents.includes(id)) {
      unit.onTurnEndEvents.push(id);
    }

    // Add subsprite image
    Image.addSubSprite(unit.image, id);
    // Prevents units from being pushed out of the way and units
    // act as a blockade
    unit.immovable = true;
  }
  const modifier = unit.modifiers[id];
  if (modifier) {
    // Increment the number of turns that freeze is applied (can stack)
    modifier.turnsLeft = (modifier.turnsLeft || 0) + 1;
  } else {
    console.error('Freeze modifier does not exist')
  }
}
function remove(unit: Unit.IUnit) {
  unit.radius = config.UNIT_BASE_RADIUS
  // Unit can be pushed around again as other units try to move past them
  unit.immovable = false;
}

export default spell;
