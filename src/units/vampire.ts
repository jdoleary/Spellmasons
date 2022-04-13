import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as Vec from '../Vec';
import { canInteractWithTarget } from './actions/gruntAction';
import * as math from '../math';
import * as config from '../config';
import * as vampire_bite from '../cards/vampire_bite';

const unit: UnitSource = {
  id: 'vampire',
  info: {
    description: 'Blood sucking fiend!',
    image: 'units/vampire.png',
    subtype: UnitSubType.DEMON,
    probability: 30,
  },
  unitProps: {
    manaMax: 60,
    healthMax: 9,
  },
  init: (unit: Unit.IUnit) => {
    Unit.addModifier(unit, vampire_bite.id);
  },
  action: async (unit: Unit.IUnit) => {
    if (!Unit.canMove(unit)) {
      return;
    }
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (!closestEnemy) {
      // Do not move if they don't have a target
      return;
    }
    // Move to the edge of the enemy, not to their center
    const adjustedTarget = Vec.subtract(closestEnemy, math.similarTriangles(closestEnemy.x - unit.x, closestEnemy.y - unit.y, math.distance(closestEnemy, unit), config.COLLISION_MESH_RADIUS * 2));
    // Movement
    await Unit.moveTowards(unit, adjustedTarget);

    // Orient; make the sprite face it's enemy
    if (closestEnemy.x > unit.x) {
      // Assuming all units are left facing, if the enemy is to the right, make it right facing
      unit.image.sprite.scale.x = -Math.abs(unit.image.sprite.scale.x);
    } else {
      unit.image.sprite.scale.x = Math.abs(unit.image.sprite.scale.x);

    }

    // Attack closest enemy
    if (canInteractWithTarget(unit, closestEnemy.x, closestEnemy.y)) {
      await Unit.playAnimation(unit, 'units/golem_eat');
      Unit.takeDamage(closestEnemy, unit.damage, false, undefined);
      Unit.addModifier(closestEnemy, vampire_bite.id);
    }
  }
};

export default unit;
