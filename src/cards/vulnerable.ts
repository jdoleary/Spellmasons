import type * as Unit from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';

const spell: Spell = {
  card: {
    id: 'vulnerable',
    thumbnail: 'images/spell/vulnerable.png',
    probability: 5,
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
    onDamage: (unit, amount, damageDealer) => {
      // Magnify positive damage
      if (amount > 0) {
        return amount * 2;
      } else {
        return amount;
      }
    },
  },
  subsprites: {
    vulnerable: {
      imageName: 'images/spell/vulnerable.png',
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
  // Add event
  unit.onDamageEvents.push('vulnerable');

  // Add subsprite image
  Image.addSubSprite(unit.image, 'vulnerable');
}
function removeFrom(unit: Unit.IUnit) {
  // Remove event
  unit.onDamageEvents = unit.onDamageEvents.filter(
    (name) => name !== 'vulnerable',
  );
  // Remove subsprite
  Image.removeSubSprite(unit.image, 'vulnerable');
}
export default spell;
