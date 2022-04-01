
import type { IUnit } from '../Unit';
import * as Image from '../Image';
import { allCards, ICard, Spell, targetsToUnits } from './index';
import { COLLISION_MESH_RADIUS } from '../config';

const id = 'contageous';
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
        add(unit);
      }
      return state;
    },
  },
  events: {
    onTurnStart: (unit: IUnit) => {
      const coords = window.underworld.getCoordsForUnitsWithinDistanceOfTarget(unit, COLLISION_MESH_RADIUS * 4);
      // Filter out undefineds, filter out self
      const touchingUnits: IUnit[] = coords.map((coord) => window.underworld.getUnitAt(coord)).filter(x => x !== undefined).filter(x => x !== unit) as IUnit[];
      const curseCards: ICard[] = Object.entries(unit.modifiers).filter(([_id, modValue]) => modValue.isCurse).map(([id, _mod]) => allCards[id]).filter(x => x !== undefined) as ICard[];
      for (let card of curseCards) {


        card?.effect({ casterUnit: unit, targets: touchingUnits, aggregator: {} }, false, 0);
      }

      return false;
    },
  },
};
export default spell;
