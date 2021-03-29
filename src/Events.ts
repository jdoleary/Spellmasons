import type { Coords } from './commonTypes';
import type { IUnit } from './Unit';

type onDamage = {
  // Returns a possibly modified damage
  (unit: IUnit, amount: number, damageDealer?: IUnit): number;
};

type onDeath = {
  (unit: IUnit, damageDealer?: IUnit): void;
};

type onMove = {
  // Returns a possibly modified coordinate
  (unit: IUnit, newLocation: Coords): Coords;
};

type onAgro = {
  // Returns a possibly modified agroTarget
  (agroer: IUnit, agroTarget: IUnit): IUnit;
};

type onTurnStart = {
  (unit: IUnit): void;
};
