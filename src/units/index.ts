import type * as Unit from '../Unit';
import type { UnitSubType } from '../commonTypes';

interface ConstructorInfo {
  description: string;
  image: string;
  subtype: UnitSubType;
  probability: number;
}
export type UnitAction = {
  (self: Unit.IUnit, attackTarget: Unit.IUnit | undefined, canAttackTarget: boolean): Promise<void>;
};
export interface UnitSource {
  id: string;
  info: ConstructorInfo;
  init?: (unit: Unit.IUnit) => void;
  action: UnitAction;
  unitProps: Partial<Unit.IUnit>;
  extraTooltipInfo?: () => string;
}

/// Units to register
import manBlue from './manBlue';
import ladyBlue from './ladyBlue';
import manMohawk from './manMohawk';
import jester from './jester';
import grunt from './grunt';
import archer from './archer';
import sandGolem from './sandGolem';
import summoner from './summoner';
import demon from './demon';
import priest from './priest';
import poisoner from './poisoner';
import vampire from './vampire';
import dummy from './dummy';
import decoy from './decoy';
import nightqueen from './nightqueen';

function register(unit: UnitSource) {
  allUnits[unit.id] = unit;
}
export function registerUnits() {
  register(dummy);
  register(grunt);
  register(archer);
  register(sandGolem);
  // register(rook);
  register(summoner);
  register(demon);
  register(priest);
  register(poisoner);
  register(vampire);

  register(manBlue);
  register(ladyBlue);
  register(manMohawk);
  register(jester);
  register(decoy);
  register(nightqueen);
}


export const allUnits: { [id: string]: UnitSource } = {};
