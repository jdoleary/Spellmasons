import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import { addPixiSpriteAnimated, containerSpells, containerUnits } from '../../graphics/PixiUtils';
import Underworld from '../../Underworld';
import { bloodLobber } from '../../graphics/ui/colors';

const unit: UnitSource = {
  id: 'lobber',
  info: {
    description: 'This ranged creature will throw magic high up in the air - over walls - to deal damage to it\'s enemies.',
    image: 'units/lobberIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 210,
    bloodColor: bloodLobber,
    healthMax: 8,
    damage: 2,
  },
  spawnParams: {
    probability: 40,
    unavailableUntilLevelIndex: 2,
  },
  animations: {
    idle: 'units/lobberIdle',
    hit: 'units/lobberHit',
    attack: 'units/lobberAttack',
    die: 'units/lobberDeath',
    walk: 'units/lobberWalk',
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image) {
      unit.image.sprite.anchor.y = 0.3;
    }
  },
  action: async (unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    // Attack
    if (attackTarget && canAttackTarget) {
      // Archers attack or move, not both; so clear their existing path
      unit.path = undefined;
      Unit.orient(unit, attackTarget);
      await Unit.playComboAnimation(unit, unit.animations.attack, () => {
        return createVisualLobbingProjectile(
          unit,
          attackTarget,
          'projectile/lobberProjectile',
        ).then(() => {
          if (attackTarget) {
            Unit.takeDamage(attackTarget, unit.damage, attackTarget, underworld, false, undefined);
            // Add projectile hit animation
            Unit.addOneOffAnimation(attackTarget, 'projectile/lobberProjectileHit');
          }
        });

      });
    }
    // Movement:
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
    if (closestEnemy) {
      const distanceToEnemy = math.distance(unit, closestEnemy);
      // Trick to make the unit only move as far as will put them in range but no closer
      unit.stamina = Math.min(unit.stamina, distanceToEnemy - unit.attackRange);
      await Unit.moveTowards(unit, closestEnemy, underworld);
    }
  },
};

export default unit;
