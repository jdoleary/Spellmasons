import type * as Unit from '../Unit';
import type { UnitSubType } from '../../types/commonTypes';

interface ConstructorInfo {
  description: Localizable;
  image: string;
  subtype: UnitSubType;
}
export type UnitAction = {
  (self: Unit.IUnit, attackTargets: Unit.IUnit[], underworld: Underworld, canAttackTarget: boolean): Promise<void>;
};
export interface UnitSource {
  id: string;
  // If a unit belongs to a mod, it's modName will be automatically assigned
  // This is used to dictate wether or not the modded unit is used
  modName?: string;
  info: ConstructorInfo;
  init?: (unit: Unit.IUnit, underworld: Underworld) => void;
  action: UnitAction;
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => Unit.IUnit[];
  unitProps: Partial<Unit.IUnit>;
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
  excludeMiniboss?: boolean;
}

/// Units to register
import playerUnit from './playerUnit';
import golem from './golem';
import bloodGolem from './bloodGolem';
import archer from './archer';
import lobber from './glop';
import greenGlop from './greenGlop';
import summoner from './summoner';
import darkSummoner from './darkSummoner';
import priest from './priest';
import darkPriest from './darkPriest';
import poisoner from './poisoner';
import vampire from './vampire';
import manaVampire from './manaVampire';
import bossmason from './deathmason';
import goru from './goru';
import decoy from './decoy';
import decoy2 from './decoy2';
import decoy3 from './decoy3';
import ancient from './ancient';
import ancient_corrupted from './ancient_corrupted';
import gripthulu from './gripthulu';
import blood_archer from './blood_archer';
import ghost_archer from './ghost_archer';
import urn_ice from './urn_ice';
import urn_poison from './urn_poison';
import urn_explosive from './urn_explosive';
import Underworld from '../../Underworld';
import { Localizable } from '../../localization';

export function registerUnit(unit: UnitSource) {
  allUnits[unit.id] = unit;
}
export function registerUnits() {
  registerUnit(golem);
  registerUnit(archer);
  registerUnit(lobber);
  registerUnit(ancient);
  registerUnit(ancient_corrupted);
  registerUnit(priest);
  registerUnit(poisoner);
  registerUnit(vampire);
  registerUnit(gripthulu);
  registerUnit(summoner);
  registerUnit(bloodGolem);
  registerUnit(blood_archer);
  registerUnit(ghost_archer);
  registerUnit(greenGlop);
  registerUnit(manaVampire);
  registerUnit(darkSummoner);
  registerUnit(darkPriest);
  registerUnit(playerUnit);
  registerUnit(bossmason);
  registerUnit(goru);
  registerUnit(decoy);
  registerUnit(decoy2);
  registerUnit(decoy3);
  registerUnit(urn_ice);
  registerUnit(urn_poison);
  registerUnit(urn_explosive);
}


export const allFamiliars: string[] = ['phoenix', 'spirit', 'octo'];
globalThis.allFamiliars = allFamiliars;
export const allUnits: { [id: string]: UnitSource } = {};
// @ts-ignore: This is for the menu and does not need to be in the global type
globalThis.allUnits = allUnits;
