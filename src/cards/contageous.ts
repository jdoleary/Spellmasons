
import type { IUnit } from '../Unit';
import * as Image from '../Image';
import { allCards, ICard, Spell, targetsToUnits } from './index';
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
  unit.onTurnStartEvents.push(id);
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
    probability: 5,
    thumbnail: 'contageous.png',
    description: `
Makes this unit's curses contageous to other nearby units
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let unit of targetsToUnits(state.targets)) {
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
    onTurnStart: async (unit: IUnit) => {
      const coords = window.underworld.getCoordsForUnitsWithinDistanceOfTarget(unit, COLLISION_MESH_RADIUS * 4);
      const nearByUnits: IUnit[] = coords.map((coord) => window.underworld.getUnitAt(coord))
        // Filter out undefineds
        .filter(x => x !== undefined)
        // Do not spread to dead units
        .filter(x => x?.alive)
        // Filter out self
        .filter(x => x !== unit) as IUnit[];
      const curseCards: ICard[] = Object.entries(unit.modifiers).filter(([_id, modValue]) => modValue.isCurse).map(([id, _mod]) => allCards[id]).filter(x => x !== undefined) as ICard[];
      for (let card of curseCards) {
        const promises = [];
        // Filter out units that already have this curse
        for (let touchingUnit of nearByUnits.filter(u => !Object.keys(u.modifiers).includes(card.id))) {
          promises.push(createVisualLobbingProjectile(
            unit,
            touchingUnit.x,
            touchingUnit.y,
            'green-thing.png',
          ).then(() => {
            floatingText({ coords: touchingUnit, text: card.id, style: { fill: 'white' } });
          }));
        }
        await Promise.all(promises);

        for (let target of nearByUnits) {
          Unit.addModifier(target, card.id);
        }
      }

      return false;
    },
  },
};
export default spell;
