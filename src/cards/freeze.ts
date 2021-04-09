import * as Unit from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';
const id = 'freeze';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'images/spell/freeze.png',
    probability: 20,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          addTo(unit);
        }
      }
      return state;
    },
  },
  events: {
    onTurnStart: (unit: Unit.IUnit) => {
      // Decrement how many turns left the unit is frozen
      unit.modifiers[id] && unit.modifiers[id].turnsLeft--;
      if (unit.modifiers[id] && unit.modifiers[id].turnsLeft <= 0) {
        Unit.removeModifier(unit, id);
      }
      // Abort turn
      return true;
    },
  },
  subsprites: {
    freeze: {
      imageName: 'images/spell/freeze.png',
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  },
};

function addTo(unit: Unit.IUnit) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = { isCurse: true };
    // Add event
    unit.onTurnStartEvents.push(id);

    // Add subsprite image
    Image.addSubSprite(unit.image, id);
  }
  // Increment the number of turns that freeze is applied (can stack)
  unit.modifiers[id].turnsLeft = (unit.modifiers[id].turnsLeft || 0) + 1;
}

export default spell;
