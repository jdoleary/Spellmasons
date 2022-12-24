import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { meleeAction } from './actions/meleeAction';
import * as config from '../../config'
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';

const unit: UnitSource = {
  id: 'golem',
  info: {
    description: 'A simple but persistant creature that will pursue its enemies and attack them if within arm\'s reach.',
    image: 'units/gruntIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    staminaMax: config.UNIT_BASE_STAMINA,
    attackRange: 10 + config.COLLISION_MESH_RADIUS * 2,
    manaMax: 0,
    healthMax: 2,
    damage: 3,
  },
  spawnParams: {
    probability: 100,
    budgetCost: 1,
    unavailableUntilLevelIndex: 0,
  },
  animations: {
    idle: 'units/gruntIdle',
    hit: 'units/gruntHit',
    attack: 'units/gruntAttack',
    die: 'units/gruntDeath',
    walk: 'units/gruntWalk',
  },
  sfx: {
    // Golem shares hurt sfx with archer intentionally
    damage: 'archerHurt',
    death: 'golemDeath'
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    await meleeAction(unit, attackTargets, underworld, async (attackTarget: Unit.IUnit) => {
      await Unit.playComboAnimation(unit, unit.animations.attack, async () =>
        Unit.takeDamage(attackTarget, unit.damage, unit, underworld, false, undefined)
      );
    })
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const closestUnit = Unit.findClosestUnitInDifferentFaction(unit, underworld);
    if (closestUnit) {
      return [closestUnit];
    } else {
      return [];
    }
  }
};

export default unit;
