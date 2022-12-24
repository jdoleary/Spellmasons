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
  // The amount that a unit costs to spawn in the level's spawn budget.
  // This ensures that level difficulty remains someone the same relative to index.
  // For example, level 5 could have 1 super powerful guy and 4 small or 8 small and 0 super powerful
  // but not 4 super powerful and 1 small.
  budgetCost: number;
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
import bossmason from './bossmason';
import decoy from './decoy';
// TODO: Dragger is causing desync in multiplayer
// import dragger from './dragger';
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
  // TODO: Dragger is causing desync in multiplayer
  // register(dragger);
  register(summoner);
  register(bloodGolem);
  register(blood_archer);
  register(ghost_archer);
  register(greenGlop);
  register(sandVampire);
  register(darkSummoner);
  register(darkPriest);
  register(playerUnit);
  register(bossmason);
  register(decoy);
}


export const allUnits: { [id: string]: UnitSource } = {};
