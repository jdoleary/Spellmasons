import type { Coords } from './commonTypes';
import floatingText from './FloatingText';
import { modifiersSource } from './Modifiers';
import type { IUnit } from './Unit';

export type onDamage = {
  // Returns a possibly modified damage
  (unit: IUnit, amount: number, damageDealer?: IUnit): number;
};

const onDamageSource: { [name: string]: onDamage } = {
  make_vulnerable: (unit, amount, damageDealer) => {
    // Magnify positive damage
    if (amount > 0) {
      return amount * 2;
    } else {
      return amount;
    }
  },
  shield: (unit, amount, damageDealer) => {
    // Only block damage, not heals
    if (amount > 0) {
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
    } else {
      return amount;
    }
  },
};

export type onDeath = {
  (unit: IUnit, damageDealer?: IUnit): void;
};
const onDeathSource: { [name: string]: onDeath } = {};

export type onMove = {
  // Returns a possibly modified coordinate
  (unit: IUnit, newLocation: Coords): Coords;
};
const onMoveSource: { [name: string]: onMove } = {};

export type onAgro = {
  // Returns a possibly modified agroTarget
  (agroer: IUnit, agroTarget: IUnit): IUnit;
};
const onAgroSource: { [name: string]: onAgro } = {};

export type onTurnStart = {
  // Return boolean skips the turn if true
  (unit: IUnit): boolean;
};
const onTurnSource: { [name: string]: onTurnStart } = {
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

export default {
  onAgroSource,
  onDamageSource,
  onDeathSource,
  onMoveSource,
  onTurnSource,
};
