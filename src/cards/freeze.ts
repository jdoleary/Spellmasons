import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import { CardCategory, UnitType } from '../types/commonTypes';
import * as config from '../config'
import type Underworld from '../Underworld';
import { animateSpell, playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';

export const id = 'freeze';
const imageName = 'spell-effects/spellFreeze_still.png';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 2,
    probability: 50,
    thumbnail: 'spellIconFreeze.png',
    animationPath: 'spell-effects/spellFreeze',
    description: `
Freezes the target(s) for 1 turn, preventing them from moving or acting.
"Freeze" can be cast multiple times in succession to stack it's effect.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // TODO: IF freeze is enchanced to affect pickups, it'll need to use targetedPickups too
      await Promise.all([playDefaultSpellAnimation(card, state.targetedUnits, prediction), playDefaultSpellSFX(card, prediction)]);
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id, underworld, prediction, quantity);
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
    subsprite: {
      imageName,
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
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld) => {
      // Decrement how many turns left the unit is frozen
      const modifier = unit.modifiers[id];
      if (modifier) {
        modifier.turnsLeft--;
        if (modifier.turnsLeft <= 0) {
          Unit.removeModifier(unit, id, underworld);
        }
      }
    },
  },

};

function add(unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.radius = config.COLLISION_MESH_RADIUS
    unit.modifiers[id] = { isCurse: true };
    // Immediately set stamina to 0 so they can't move
    unit.stamina = 0;
    // Add event
    if (!unit.onTurnStartEvents.includes(id)) {
      unit.onTurnStartEvents.push(id);
    }
    if (!unit.onTurnEndEvents.includes(id)) {
      unit.onTurnEndEvents.push(id);
    }

    // Add subsprite image
    Image.addSubSprite(unit.image, id);
    // Stop the animation
    unit.image?.sprite.stop();
    // Prevents units from being pushed out of the way and units
    // act as a blockade
    unit.immovable = true;
    // If the frozen unit is a player, end their turn when they become frozen
    if (unit.unitType === UnitType.PLAYER_CONTROLLED) {
      const player = underworld.players.find(
        (p) => p.unit === unit,
      );
      if (player) {
        underworld.endPlayerTurn(player.clientId);
      }
    }
  }
  const modifier = unit.modifiers[id];
  if (modifier) {
    // Increment the number of turns that freeze is applied (can stack)
    modifier.turnsLeft = (modifier.turnsLeft || 0) + quantity;
  } else {
    console.error('Freeze modifier does not exist')
  }
}
function remove(unit: Unit.IUnit) {
  unit.radius = config.UNIT_BASE_RADIUS
  // Unit can be pushed around again as other units try to move past them
  unit.immovable = false;
  // Resume the animation
  unit.image?.sprite.play();
}

export default spell;
