import type { Coords } from './commonTypes';
import floatingText from './FloatingText';
import { modifiersSource } from './Modifiers';
import type { IUnit } from './Unit';

type onDamage = {
  // Returns a possibly modified damage
  (unit: IUnit, amount: number, damageDealer?: IUnit): number;
};

export const onDamageSource: { [name: string]: onDamage } = {
  shield: (unit, amount, damageDealer) => {
    floatingText({
      cellX: unit.x,
      cellY: unit.y,
      text: 'Shielded from damage!',
      style: {
        fill: 'blue',
      },
    });

    unit.modifiers.shield && unit.modifiers.shield.stacks--;
    if (unit.modifiers.shield && unit.modifiers.shield.stacks <= 0) {
      modifiersSource.shield.remove(unit);
    }

    // Take no damage
    return 0;
  },
};

type onDeath = {
  (unit: IUnit, damageDealer?: IUnit): void;
};

type onMove = {
  // Returns a possibly modified coordinate
  (unit: IUnit, newLocation: Coords): Coords;
};
export const onMoveSource: { [name: string]: onMove } = {};

type onAgro = {
  // Returns a possibly modified agroTarget
  (agroer: IUnit, agroTarget: IUnit): IUnit;
};

type onTurnStart = {
  // Return boolean skips the turn if true
  (unit: IUnit): boolean;
};
export const onTurnSource: { [name: string]: onTurnStart } = {
  freeze: (unit) => {
    // Decrement how many turns left the unit is frozen
    unit.modifiers.freeze && unit.modifiers.freeze.turnsLeft--;
    if (unit.modifiers.freeze && unit.modifiers.freeze.turnsLeft <= 0) {
      modifiersSource.freeze.remove(unit);
    }
    // Abort turn
    return true;
  },
};
