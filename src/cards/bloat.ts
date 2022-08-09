import { IUnit, takeDamage } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import { drawPredictionCircle } from '../graphics/PlanningView';
import { forcePush, velocityStartMagnitude } from './push';
import type Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { animateSpell } from './cardUtils';

const id = 'Bloat';
const imageName = 'explode-on-death.png';
const damage = 3;
const range = 140;
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = {
      isCurse: true,
      quantity
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
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'spellIconBloat.png',
    description: `Cursed targets explode when they die dealing ${damage} damage to all units within the
    explosion radius.
    Multiple stacks of bloat will increase the amount of damage done when the unit explodes.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id, underworld, prediction, quantity);
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
    onDeath: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
      const quantity = unit.modifiers[id]?.quantity || 1;
      drawPredictionCircle(unit, range, 'Explosion Radius');
      if (!prediction) {
        animateSpell(unit, 'explode-on-death.png');
      }
      underworld.getUnitsWithinDistanceOfTarget(
        unit,
        range,
        prediction
      ).forEach(u => {
        // Push units away from exploding unit
        forcePush(u, unit, velocityStartMagnitude, underworld, prediction);
        // Deal damage to units
        takeDamage(u, damage * quantity, u, underworld, prediction);
      });
      underworld.getPickupsWithinDistanceOfTarget(
        unit,
        range,
        prediction
      ).forEach(p => {
        // Push pickups away
        forcePush(p, unit, velocityStartMagnitude, underworld, prediction);
      })
    }
  }
};
export default spell;
