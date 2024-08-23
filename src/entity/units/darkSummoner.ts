import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import Underworld from '../../Underworld';
import { MultiColorReplaceFilter } from 'pixi-filters';
import { summonerAction, summonerGetUnitAttackTargets } from './summoner';
import { DARK_PRIEST_ID } from './darkPriest';
import { MANA_VAMPIRE_ID } from './manaVampire';

export const DARK_SUMMONER_ID = 'Dark Summoner';
const manaCostToCast = 60;
const unit: UnitSource = {
  id: DARK_SUMMONER_ID,
  info: {
    description: 'dark_summoner_copy',
    image: 'units/summonerIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  animations: {
    idle: 'units/summonerIdle',
    hit: 'units/summonerHit',
    attack: 'units/summonerAttack',
    die: 'units/summonerDeath',
    walk: 'units/summonerWalk',
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
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.unshift(
        new MultiColorReplaceFilter(
          [
            [0x5b3357, 0x222222], // dark robes
            [0x774772, 0x2c2c2c], // light robes
            [0xff00e4, 0x852124], //eyes
            [0x90768e, 0xaeaeae], // arm shade
          ],
          0.1
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    // attackTargets has irregular usage for this unit, see explanation in this file's getUnitAttackTargets()
    await summonerAction(unit, !!attackTargets.length, underworld, { closeUnit: allUnits[MANA_VAMPIRE_ID], farUnit: allUnits[DARK_PRIEST_ID] }, 2);
  },
  getUnitAttackTargets: summonerGetUnitAttackTargets
};
export default unit;
