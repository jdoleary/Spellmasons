import type * as Unit from '../Unit';
import type { UnitSubType } from '../commonTypes';

interface ConstructorInfo {
  description: string;
  image: string;
  subtype: UnitSubType;
  probability: number;
}
export type UnitAction = {
  (unit: Unit.IUnit): Promise<void>;
};
export type canInteractWithTarget = {
  (unit: Unit.IUnit, x: number, y: number): boolean;
};
export interface UnitSource {
  id: string;
  info: ConstructorInfo;
  action: UnitAction;
  canInteractWithTarget?: canInteractWithTarget;
  unitProps: Partial<Unit.IUnit>
}

/// Units to register
import manBlue from './manBlue';
import ladyBlue from './ladyBlue';
import manMohawk from './manMohawk';
import jester from './jester';
import grunt from './grunt';
import archer from './archer';
import sandGolem from './sandGolem';
import rook from './rook';
import summoner from './summoner';
import demon from './demon';
import priest from './priest';
import poisoner from './poisoner';

function register(unit: UnitSource) {
  allUnits[unit.id] = unit;
}
export function registerUnits() {
  register(grunt);
  register(archer);
  register(sandGolem);
  register(rook);
  register(summoner);
  register(demon);
  register(priest);
  register(poisoner);
  register(manBlue);
  register(ladyBlue);
  register(manMohawk);
  register(jester);
}

export const allUnits: { [id: string]: UnitSource } = {};
