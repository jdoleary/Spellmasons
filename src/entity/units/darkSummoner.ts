import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import Underworld from '../../Underworld';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { summonerAction, summonerGetUnitAttackTargets } from './summoner';

export const DARK_SUMMONER_ID = 'Dark Summoner';
const manaCostToCast = 60;
const unit: UnitSource = {
  id: DARK_SUMMONER_ID,
  info: {
    description: 'The Dark Summoner will ruin you if you give him too much time - he summons common summoners who will summon yet more enemies.',
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
    healthMax: 18,
    damage: 0,
    attackRange: 550,
    manaCostToCast,
    manaMax: 60,
    manaPerTurn: 30,
    bloodColor: 0x852124
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 12,
  },
  extraTooltipInfo: () => {
    return `Mana cost per summon: ${manaCostToCast}`;
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.push(
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
    await summonerAction(unit, !!attackTargets.length, underworld, { closeUnit: allUnits.summoner, farUnit: allUnits.summoner }, 1);
  },
  getUnitAttackTargets: summonerGetUnitAttackTargets
};
export default unit;
