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
    image: 'units/vampire.png',
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

    // Orient; make the sprite face it's enemy
    if (unit.image) {

      if (attackTarget.x > unit.x) {
        // Assuming all units are left facing, if the enemy is to the right, make it right facing
        unit.image.sprite.scale.x = -Math.abs(unit.image.sprite.scale.x);
      } else {
        unit.image.sprite.scale.x = Math.abs(unit.image.sprite.scale.x);

      }
    }

    // Attack closest enemy
    if (canAttackTarget) {
      await Unit.playAnimation(unit, 'units/golem_eat');
      Unit.takeDamage(attackTarget, unit.damage, false, undefined);
      Unit.addModifier(attackTarget, vampire_bite.id);
    }
  }
};

export default unit;
