import type * as Unit from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';

const spell: Spell = {
  card: {
    id: 'freeze',
    thumbnail: 'images/spell/freeze.png',
    probability: 20,
    effect: (state, dryRun) => {
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
      unit.modifiers.freeze && unit.modifiers.freeze.turnsLeft--;
      if (unit.modifiers.freeze && unit.modifiers.freeze.turnsLeft <= 0) {
        removeFrom(unit);
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
  if (!unit.modifiers.freeze) {
    unit.modifiers.freeze = {};
    // Add event
    unit.onTurnStartEvents.push('freeze');

    // Add subsprite image
    Image.addSubSprite(unit.image, 'freeze');
  }
  // Increment the number of turns that freeze is applied (can stack)
  unit.modifiers.freeze.turnsLeft = (unit.modifiers.freeze.turnsLeft || 0) + 1;
  console.log(
    '🚀 ~ file: freeze.ts ~ line 62 ~ addTo ~ unit.modifiers',
    unit.modifiers,
  );
}
function removeFrom(unit: Unit.IUnit) {
  delete unit.modifiers.freeze;
  // Remove event
  unit.onTurnStartEvents = unit.onTurnStartEvents.filter(
    (name) => name !== 'freeze',
  );
  // Remove subsprite
  Image.removeSubSprite(unit.image, 'freeze');
}
export default spell;
