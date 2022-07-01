import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as Vec from '../Vec';
import * as math from '../math';
import * as config from '../config';
import * as vampire_bite from '../cards/vampire_bite';

const unit: UnitSource = {
  id: 'vampire',
  info: {
    description: 'A vampire takes half damage when hurt, but takes all heals as pure damage.  Beware that it doesn\'t get close enough to bite you or you too will become a vampire!',
    image: 'units/vampireIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    manaMax: 60,
    healthMax: 18,
    damage: 5
  },
  spawnParams: {
    probability: 15,
    unavailableUntilLevelIndex: 5,
  },
  animations: {
    idle: 'units/vampireIdle',
    hit: 'units/vampireHit',
    attack: 'units/vampireAttack',
    die: 'units/vampireDeath',
    walk: 'units/vampireWalk',
  },
  init: (unit: Unit.IUnit) => {
    Unit.addModifier(unit, vampire_bite.id);
  },
  action: async (unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, canAttackTarget: boolean) => {
    if (!Unit.canMove(unit)) {
      return;
    }
    if (!attackTarget) {
      // Do not move if they don't have a target
      return;
    }
    // Move to the edge of the enemy, not to their center
    const adjustedTarget = Vec.subtract(attackTarget, math.similarTriangles(attackTarget.x - unit.x, attackTarget.y - unit.y, math.distance(attackTarget, unit), config.COLLISION_MESH_RADIUS * 2));
    // Movement
    await Unit.moveTowards(unit, adjustedTarget);

    // Attack closest enemy
    if (canAttackTarget) {
      await Unit.playAnimation(unit, unit.animations.attack);
      Unit.takeDamage(attackTarget, unit.damage, false, undefined);
      Unit.addModifier(attackTarget, vampire_bite.id);
    }
  }
};

export default unit;
