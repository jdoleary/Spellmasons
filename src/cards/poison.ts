import { IUnit, takeDamage } from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';
const id = 'poison';
export function add(unit: IUnit) {
  // Note: Curse can stack multiple times but doesn't keep any state
  // so it doesn't need a first time setup like freeze does

  unit.modifiers[id] = { isCurse: true };
  // Add event
  unit.onTurnStartEvents.push(id);
  // Add subsprite image
  Image.addSubSprite(unit.image, id);
}

const spell: Spell = {
  subsprites: {
    poison: {
      imageName: 'poison.png',
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
  card: {
    id,
    thumbnail: 'poison.png',
    probability: 10,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target);
        if (unit) {
          add(unit);
        }
      }
      return state;
    },
  },
  events: {
    onTurnStart: (unit: IUnit) => {
      takeDamage(unit, 1);
      return false;
    },
  },
};
export default spell;
