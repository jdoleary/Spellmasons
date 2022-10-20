import type * as Unit from '../Unit';
import type { UnitSubType } from '../../types/commonTypes';

interface ConstructorInfo {
  description: string;
  image: string;
  subtype: UnitSubType;
}
export type UnitAction = {
  (self: Unit.IUnit, attackTarget: Unit.IUnit | undefined, underworld: Underworld, canAttackTarget: boolean): Promise<void>;
};
export interface UnitSource {
  id: string;
  info: ConstructorInfo;
  init?: (unit: Unit.IUnit, underworld: Underworld) => void;
  action: UnitAction;
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
import archer from './archer';
import lobber from './lobber';
import summoner from './summoner';
import priest from './priest';
import poisoner from './poisoner';
import vampire from './vampire';
import decoy from './decoy';
import dragger from './dragger';
import Underworld from '../../Underworld';

function register(unit: UnitSource) {
  allUnits[unit.id] = unit;
}
export function registerUnits() {
  register(golem);
  register(archer);
  register(lobber);
  register(summoner);
  register(priest);
  register(poisoner);
  register(vampire);
  register(dragger);
  register(playerUnit);
  register(decoy);
}


export const allUnits: { [id: string]: UnitSource } = {};
