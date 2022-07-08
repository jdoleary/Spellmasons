import { IUnit, takeDamage } from '../Unit';
import * as Unit from '../Unit';
import * as Image from '../graphics/Image';
import type { Spell } from '.';
import { drawPredictionCircle } from '../graphics/PlanningView';
import { forcePush } from './push';

const id = 'Bloat';
const imageName = 'explode-on-death.png';
const damage = 3;
const range = 140;
function add(unit: IUnit) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = {
      isCurse: true,
    };
    // Add event
    if (!unit.onDeathEvents.includes(id)) {
      unit.onDeathEvents.push(id);
    }
    // Add subsprite image
    Image.addSubSprite(unit.image, id);
  }
}

const spell: Spell = {
  card: {
    id,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'explode-on-death.png',
    description: `Cursed targets explode when they die dealing ${damage} to all units within the
    explosion radius.`,
    effect: async (state, prediction) => {
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id);
      }
      return state;
    },
  },
  modifiers: {
    add,
    subsprite: {
      imageName,
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
  events: {
    onDeath: async (unit: IUnit, prediction: boolean) => {
      drawPredictionCircle(unit, range);
      if (!prediction) {
        window.underworld.animateSpell(unit, 'explode-on-death.png');
      }
      window.underworld.getUnitsWithinDistanceOfTarget(
        unit,
        range,
        prediction
      ).forEach(u => {
        // Push units away from exploding unit
        forcePush(u, unit, prediction);
        // Deal damage to units
        takeDamage(u, damage, prediction);
      });
      window.underworld.getPickupsWithinDistanceOfTarget(
        unit,
        range
      ).forEach(p => {
        // Push pickups away
        forcePush(p, unit, prediction);
      })
    }
  }
};
export default spell;
