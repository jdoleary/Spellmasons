import { IUnit, takeDamage } from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';

function add(unit: IUnit) {
  // First time setup
  // Add event
  unit.onTurnStartEvents.push('poison');

  // Add subsprite image
  Image.addSubSprite(unit.image, 'poison');
}

const poison: Spell = {
  subsprites: {
    poison: {
      imageName: 'images/spell/poison.png',
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
  card: {
    id: 'poison',
    thumbnail: 'images/spell/poison.png',
    probability: 10,
    effect: (state) => {
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
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
export default poison;
