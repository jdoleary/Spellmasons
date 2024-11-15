import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import { bloodLobber } from '../../graphics/ui/colors';
import * as config from '../../config';
import * as Image from '../../graphics/Image';

// "glop" was initially "lobber"
export const GLOP_UNIT_ID = 'glop';
const unit: UnitSource = {
  id: GLOP_UNIT_ID,
  info: {
    description: 'glop description',
    image: 'lobberIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 20,
    attackRange: 400,
    healthMax: 60,
    mana: 30,
    manaMax: 30,
    manaPerTurn: 10,
    manaCostToCast: 5,
    bloodColor: bloodLobber,
  },
  spawnParams: {
    probability: 40,
    budgetCost: 4,
    unavailableUntilLevelIndex: 2,
  },
  animations: {
    idle: 'lobberIdle',
    hit: 'lobberHit',
    attack: 'lobberAttack',
    die: 'lobberDeath',
    walk: 'lobberWalk',
  },
  sfx: {
    damage: 'lobberHurt',
    death: 'lobberDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image) {
      unit.image.sprite.anchor.y = 0.3;
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    const attackTarget = attackTargets && attackTargets[0];
    // Attack
    if (attackTarget && canAttackTarget) {
      Unit.orient(unit, attackTarget);
      Unit.tryAttack(unit, () => {
        Unit.playComboAnimation(unit, unit.animations.attack, () => {
          return createVisualLobbingProjectile(
            unit,
            attackTarget,
            'lobberProjectile',
          ).then(() => {
            if (attackTarget) {
              Unit.takeDamage({
                unit: attackTarget,
                amount: unit.damage,
                sourceUnit: unit,
                fromVec2: unit,
              }, underworld, false);
              // Add projectile hit animation
              Image.addOneOffAnimation(attackTarget, 'lobberProjectileHit');
            }
          });
        });
      });
    } else {
      // Movement:
      if (attackTarget) {
        const distanceToEnemy = math.distance(unit, attackTarget);
        // The following is a hacky way to make them not move too close to the enemy
        unit.stamina = Math.min(unit.stamina, distanceToEnemy - config.COLLISION_MESH_RADIUS);
        await Unit.moveTowards(unit, attackTarget, underworld);
      }
    }
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
