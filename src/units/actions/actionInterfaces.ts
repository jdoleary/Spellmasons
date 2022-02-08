import type * as Unit from '../../Unit';
export type CanInteractWithTarget = (unit: Unit.IUnit, x: number, y: number) => boolean
export type Attack = (target: Unit.IUnit) => Promise<void>;