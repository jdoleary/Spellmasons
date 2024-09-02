import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { meleeAction } from './actions/meleeAction';
import * as config from '../../config'
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';

export const BLOOD_GOLEM_ID = 'Blood Golem';
const unit: UnitSource = {
  id: BLOOD_GOLEM_ID,
  info: {
    description: 'blood_golem_copy',
    image: 'units/blood_golem/gruntIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    damage: 40,
    staminaMax: config.UNIT_BASE_STAMINA * 1.2,
    healthMax: 60,
    manaMax: 0,
    bloodColor: 0x8a2e2e,
  },
  spawnParams: {
    probability: 100,
    budgetCost: 4,
    unavailableUntilLevelIndex: 4,
  },
  animations: {
    idle: 'units/blood_golem/gruntIdle',
    hit: 'units/blood_golem/gruntHit',
    attack: 'units/blood_golem/gruntAttack',
    die: 'units/blood_golem/gruntDeath',
    walk: 'units/blood_golem/gruntWalk',
  },
  sfx: {
    // Golem shares hurt sfx with archer intentionally
    damage: 'archerHurt',
    death: 'golemDeath'
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    await meleeAction(unit, attackTargets, underworld, canAttackTarget, async (attackTarget: Unit.IUnit) => {
      await Unit.playComboAnimation(unit, unit.animations.attack, async () =>
        Unit.takeDamage({
          unit: attackTarget,
          amount: unit.damage,
          sourceUnit: unit,
          fromVec2: unit,
        }, underworld, false)
      );
    })
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const closestUnit = Unit.findClosestUnitInDifferentFactionSmartTarget(unit, underworld.units);
    if (closestUnit) {
      return [closestUnit];
    } else {
      return [];
    }
  }
};

export default unit;
