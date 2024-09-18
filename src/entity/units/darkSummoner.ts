import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import Underworld from '../../Underworld';
import { summonerAction, summonerGetUnitAttackTargets } from './summoner';
import { DARK_PRIEST_ID } from './darkPriest';
import { MANA_VAMPIRE_ID } from './manaVampire';

export const DARK_SUMMONER_ID = 'Dark Summoner';
const manaCostToCast = 60;
const unit: UnitSource = {
  id: DARK_SUMMONER_ID,
  info: {
    description: 'dark_summoner_copy',
    image: 'units/dark_summoner/summonerIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  animations: {
    idle: 'units/dark_summoner/summonerIdle',
    hit: 'units/dark_summoner/summonerHit',
    attack: 'units/dark_summoner/summonerAttack',
    die: 'units/dark_summoner/summonerDeath',
    walk: 'units/dark_summoner/summonerWalk',
  },
  sfx: {
    damage: 'summonerHurt',
    death: 'summonerDeath'
  },
  unitProps: {
    damage: 0,
    attackRange: 550,
    healthMax: 180,
    mana: 90,
    manaMax: 120,
    manaPerTurn: 30,
    manaCostToCast: 120,
    bloodColor: 0x852124,
  },
  spawnParams: {
    probability: 20,
    budgetCost: 13,
    unavailableUntilLevelIndex: 9,
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    // attackTargets has irregular usage for this unit, see explanation in this file's getUnitAttackTargets()
    await summonerAction(unit, !!attackTargets.length, underworld, { closeUnit: allUnits[MANA_VAMPIRE_ID], farUnit: allUnits[DARK_PRIEST_ID] }, 2);
  },
  getUnitAttackTargets: summonerGetUnitAttackTargets
};
export default unit;
