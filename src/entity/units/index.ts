import type * as Unit from '../Unit';
import type { UnitSubType } from '../../types/commonTypes';

interface ConstructorInfo {
  description: string;
  image: string;
  subtype: UnitSubType;
}
export type UnitAction = {
  (self: Unit.IUnit, attackTargets: Unit.IUnit[], underworld: Underworld, canAttackTarget: boolean): Promise<void>;
};
export interface UnitSource {
  id: string;
  info: ConstructorInfo;
  init?: (unit: Unit.IUnit, underworld: Underworld) => void;
  action: UnitAction;
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => Unit.IUnit[];
  unitProps: Partial<Unit.IUnit>;
  extraTooltipInfo?: () => string;
  spawnParams?: SpawnParams;
  animations: Unit.UnitAnimations;
  sfx: Unit.UnitSFX;
}

interface SpawnParams {
  probability: number;
  unavailableUntilLevelIndex: number;
}

/// Units to register
import playerUnit from './playerUnit';
import golem from './golem';
import bloodGolem from './bloodGolem';
import archer from './archer';
import lobber from './lobber';
import greenGlop from './greenGlop';
import summoner from './summoner';
import darkSummoner from './darkSummoner';
import priest from './priest';
import darkPriest from './darkPriest';
import poisoner from './poisoner';
import vampire from './vampire';
import sandVampire from './sandVampire';
import decoy from './decoy';
import dragger from './dragger';
import blood_archer from './blood_archer';
import ghost_archer from './ghost_archer';
import Underworld from '../../Underworld';

function register(unit: UnitSource) {
  allUnits[unit.id] = unit;
}
export function registerUnits() {
  register(golem);
  register(archer);
  register(lobber);
  register(priest);
  register(poisoner);
  register(vampire);
  register(dragger);
  register(summoner);
  register(bloodGolem);
  register(blood_archer);
  register(ghost_archer);
  register(greenGlop);
  register(sandVampire);
  register(darkSummoner);
  register(darkPriest);
  register(playerUnit);
  register(decoy);
}


export const allUnits: { [id: string]: UnitSource } = {};
