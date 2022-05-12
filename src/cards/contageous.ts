
import type { IUnit } from '../Unit';
import * as Image from '../Image';
import { allCards, ICard, Spell } from './index';
import { COLLISION_MESH_RADIUS } from '../config';
import { createVisualLobbingProjectile } from '../Projectile';
import floatingText from '../FloatingText';
import * as Unit from '../Unit';

const id = 'contageous';
function add(unit: IUnit) {
  // Note: Curse can stack multiple times but doesn't keep any state
  // so it doesn't need a first time setup like freeze does

  unit.modifiers[id] = { isCurse: true };
  // Add event
  // Note: contageous should always be the first modifier or else other modifiers may expire before they can spread
  // for example, freeze then contageous.  This is why it unshifts the contageous eventn
  // TODO: This may require a pre-turn-start event phase
  unit.onTurnStartEvents.unshift(id);
  // Add subsprite image
  Image.addSubSprite(unit.image, id);
}

const spell: Spell = {
  subsprites: {
    contageous: {
      imageName: 'contageous.png',
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
    manaCost: 50,
    healthCost: 0,
    expenseScaling: 1,
    probability: 5,
    thumbnail: 'contageous.png',
    description: `
Makes this unit's curses contageous to other nearby units
    `,
    effect: async (state, prediction) => {
      for (let unit of state.targetedUnits) {
        // Don't add contageous more than once
        if (!unit.onTurnStartEvents.includes(id)) {
          Unit.addModifier(unit, id);
        }
      }
      return state;
    },
  },
  modifiers: {
    add
  },
  events: {
    onTurnStart: async (unit: IUnit, prediction: boolean) => {
      const nearByUnits = window.underworld.getUnitsWithinDistanceOfTarget(unit, COLLISION_MESH_RADIUS * 4, prediction)
        // Filter out undefineds
        .filter(x => x !== undefined)
        // Do not spread to dead units
        .filter(x => x?.alive)
        // Filter out self
        .filter(x => x !== unit) as IUnit[];
      const curseCards: ICard[] = Object.entries(unit.modifiers)
        // Only curses are contageous
        // Do not make contageous itself contageous
        .filter(([cardId, modValue]) => modValue.isCurse && cardId !== id)
        .map(([id, _mod]) => allCards[id])
        .filter(x => x !== undefined) as ICard[];
      for (let card of curseCards) {
        const promises = [];
        // Filter out units that already have this curse
        for (let touchingUnit of nearByUnits.filter(u => !Object.keys(u.modifiers).includes(card.id))) {
          if (!prediction) {
            // Visually show the contageon
            promises.push(createVisualLobbingProjectile(
              unit,
              touchingUnit,
              'green-thing.png',
            ).then(() => {
              floatingText({ coords: touchingUnit, text: card.id });
            }));
          }
          Unit.addModifier(touchingUnit, card.id);
        }
        await Promise.all(promises);

      }

      return false;
    },
  },
};
export default spell;
