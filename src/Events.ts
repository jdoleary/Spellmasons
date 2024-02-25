import type { Vec2 } from './jmath/Vec';
import type { IUnit } from './entity/Unit';
import Underworld from './Underworld';
import { IPickup } from './entity/Pickup';
import { ForceMoveProjectile } from './jmath/moveWithCollision';

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
  (unit: IUnit, prediction: boolean, underworld: Underworld): Promise<void>;
};
const onTurnStartSource: { [name: string]: onTurnStart } = {};

export type onTurnEnd = {
  (unit: IUnit, prediction: boolean, underworld: Underworld): Promise<void>;
};
const onTurnEndSource: { [name: string]: onTurnEnd } = {};

export type onDrawSelected = {
  (unit: IUnit, prediction: boolean, underworld: Underworld): Promise<void>;
};
const onDrawSelectedSource: { [name: string]: onDrawSelected } = {};

export type onProjectileCollision = ({ unit, pickup, underworld, prediction }: { unit?: IUnit, pickup?: IPickup, projectile: ForceMoveProjectile, underworld: Underworld, prediction: boolean }) => Promise<void>;
const onProjectileCollisionSource: { [name: string]: onProjectileCollision } = {};

export default {
  onAgroSource,
  onDamageSource,
  onDeathSource,
  onMoveSource,
  onTurnStartSource,
  onTurnEndSource,
  onDrawSelectedSource,
  onProjectileCollisionSource
};
