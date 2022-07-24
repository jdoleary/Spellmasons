import type { Vec2 } from './jmath/Vec';
import type { IUnit } from './entity/Unit';
import Underworld from './Underworld';

export type onDamage = {
  // Returns a possibly modified damage
  (unit: IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: IUnit): number;
};

const onDamageSource: { [name: string]: onDamage } = {};

export type onDeath = {
  (unit: IUnit, underworld: Underworld, prediction: boolean): Promise<void>;
};
const onDeathSource: { [name: string]: onDeath } = {};

export type onMove = {
  // Returns a possibly modified coordinate
  (unit: IUnit, newLocation: Vec2): Vec2;
};
const onMoveSource: { [name: string]: onMove } = {};

export type onAgro = {
  // Returns a possibly modified agroTarget
  (agroer: IUnit, agroTarget: IUnit): IUnit;
};
const onAgroSource: { [name: string]: onAgro } = {};

export type onTurnStart = {
  // Return boolean skips the turn if true
  (unit: IUnit, prediction: boolean, underworld: Underworld): Promise<boolean>;
};
const onTurnStartSource: { [name: string]: onTurnStart } = {};
export type onTurnEnd = { (unit: IUnit, underworld: Underworld): Promise<void>; }
const onTurnEndSource: { [name: string]: onTurnEnd } = {};

export default {
  onAgroSource,
  onDamageSource,
  onDeathSource,
  onMoveSource,
  onTurnStartSource,
  onTurnEndSource
};
