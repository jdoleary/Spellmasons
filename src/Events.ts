import type { Vec2 } from './jmath/Vec';
import type { IUnit } from './entity/Unit';
import Underworld from './Underworld';
import { IPickup } from './entity/Pickup';
import { ForceMoveProjectile } from './jmath/moveWithCollision';
import { EffectState } from './cards';

export type onDealDamage = {
  // Returns a possibly modified damage
  (damageDealer: IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: IUnit): number;
};
const onDealDamageSource: { [name: string]: onDealDamage } = {};

// onTooltip is invoked every gameLoop for the selectedUnit if there is one
export type onTooltip = {
  (unit: IUnit, underworld: Underworld): void;
};
const onTooltipSource: { [name: string]: onTooltip } = {};


export type onTakeDamage = {
  // Returns a possibly modified damage
  (unit: IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: IUnit): number;
};
const onTakeDamageSource: { [name: string]: onTakeDamage } = {};

export type onDeath = {
  (unit: IUnit, underworld: Underworld, prediction: boolean): Promise<void>;
};
const onDeathSource: { [name: string]: onDeath } = {};

export type onMove = {
  // Returns a possibly modified coordinate
  (unit: IUnit, newLocation: Vec2): Vec2;
};
const onMoveSource: { [name: string]: onMove } = {};

export type onSpawn = {
  (unit: IUnit, underworld: Underworld, prediction: boolean): void;
};
const onSpawnSource: { [name: string]: onSpawn } = {};

export type onTeleport = {
  (unit: IUnit, newLocation: Vec2, underworld: Underworld, prediction: boolean): void;
};
const onTeleportSource: { [name: string]: onTeleport } = {};

export type onAgro = {
  // Returns a possibly modified agroTarget
  (agroer: IUnit, agroTarget: IUnit): IUnit;
};
const onAgroSource: { [name: string]: onAgro } = {};

export type onTurnStart = {
  (unit: IUnit, underworld: Underworld, prediction: boolean): Promise<void>;
};
const onTurnStartSource: { [name: string]: onTurnStart } = {};

export type onTurnEnd = {
  (unit: IUnit, underworld: Underworld, prediction: boolean): Promise<void>;
};
const onTurnEndSource: { [name: string]: onTurnEnd } = {};

export type onDrawSelected = {
  (unit: IUnit, underworld: Underworld, prediction: boolean): Promise<void>;
};
const onDrawSelectedSource: { [name: string]: onDrawSelected } = {};

export type onProjectileCollision = ({ unit, pickup, projectile, underworld, prediction }: { unit?: IUnit, pickup?: IPickup, projectile: ForceMoveProjectile, underworld: Underworld, prediction: boolean }) => void;
const onProjectileCollisionSource: { [name: string]: onProjectileCollision } = {};

export default {
  onAgroSource,
  onDealDamageSource,
  onTakeDamageSource,
  onTooltipSource,
  onDeathSource,
  onMoveSource,
  onTurnStartSource,
  onTurnEndSource,
  onDrawSelectedSource,
  onProjectileCollisionSource,
  onTeleportSource,
  onSpawnSource,
};
