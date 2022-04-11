import type { Vec2 } from './Vec';
import type { IUnit } from './Unit';

export type onDamage = {
  // Returns a possibly modified damage
  (unit: IUnit, amount: number, dryRun: boolean, damageDealer?: IUnit): number;
};

const onDamageSource: { [name: string]: onDamage } = {};

export type onDeath = {
  (unit: IUnit): void;
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
  (unit: IUnit): Promise<boolean>;
};
const onTurnSource: { [name: string]: onTurnStart } = {};

export default {
  onAgroSource,
  onDamageSource,
  onDeathSource,
  onMoveSource,
  onTurnSource,
};
