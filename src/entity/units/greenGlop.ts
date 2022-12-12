import * as Unit from '../Unit';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import * as config from '../../config';
import * as Image from '../../graphics/Image';

const greenGlopColorReplaceColors: [number, number][] = [
  [0x5fcde4, 0x63c572],
  [0x67c3d7, 0x58b866],
];
const numberOfTargets = 6;
const unit: UnitSource = {
  id: 'Green Glop',
  info: {
    description: 'The Green Glop can attack up to 6 enemies.  It lobbs gloop high into the air to deal damage to its enemies.  It can attack its enemies from behind walls.',
    image: 'units/lobberIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 210,
    bloodColor: 0x63c572,
    healthMax: 8,
    damage: 4,
    manaCostToCast: 15
  },
  spawnParams: {
    probability: 40,
    unavailableUntilLevelIndex: 9,
  },
  animations: {
    idle: 'units/lobberIdle',
    hit: 'units/lobberHit',
    attack: 'units/lobberAttack',
    die: 'units/lobberDeath',
    walk: 'units/lobberWalk',
  },
  sfx: {
    damage: 'lobberHurt',
    death: 'lobberDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image) {
      unit.image.sprite.anchor.y = 0.3;
    }
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.push(
        new MultiColorReplaceFilter(
          greenGlopColorReplaceColors,
          0.05
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    // Attack
    if (attackTargets && canAttackTarget && unit.mana >= unit.manaCostToCast) {
      unit.mana -= unit.manaCostToCast;
      // Attack or move, not both; so clear their existing path
      unit.path = undefined;
      await Unit.playComboAnimation(unit, unit.animations.attack, () => {
        let lastPromise = Promise.resolve();
        for (let i = 0; i < numberOfTargets; i++) {
          const attackTarget = attackTargets[i];
          if (attackTarget) {
            lastPromise = new Promise((resolve) => {
              // Offset the projectiles for effect
              setTimeout(() => {
                createVisualLobbingProjectile(
                  unit,
                  attackTarget,
                  'projectile/lobberProjectile',
                  {
                    loop: true,
                    colorReplace: {
                      colors: greenGlopColorReplaceColors, epsilon: 0.2
                    }
                  }
                ).then(() => {
                  if (attackTarget) {
                    Unit.takeDamage(attackTarget, unit.damage, attackTarget, underworld, false, undefined);
                    // Add projectile hit animation
                    Image.addOneOffAnimation(attackTarget, 'projectile/lobberProjectileHit', undefined, {
                      loop: false,
                      colorReplace: {
                        colors: greenGlopColorReplaceColors, epsilon: 0.2
                      }
                    });
                  }
                  resolve()
                });
              }, 100 * i);
            });
          }
        }
        return lastPromise;
      });
    } else {
      // Movement:
      const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
      if (closestEnemy) {
        const distanceToEnemy = math.distance(unit, closestEnemy);
        // The following is a hacky way to make them not move too close to the enemy
        unit.stamina = Math.min(unit.stamina, distanceToEnemy - config.COLLISION_MESH_RADIUS);
        await Unit.moveTowards(unit, closestEnemy, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return Unit.livingUnitsInDifferentFaction(unit, underworld)
      .filter(u => math.distance(unit, u) <= unit.attackRange)
      .map(u => ({ unit: u, dist: math.distance(unit, u) }))
      .sort((a, b) => {
        return a.dist - b.dist;
      })
      .map(x => x.unit)
      .slice(0, numberOfTargets);
  }
};

export default unit;
