import * as Unit from '../Unit';
import { MultiColorReplaceFilter } from 'pixi-filters';
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
    description: 'green_glop_copy',
    image: 'units/lobberIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 40,
    attackRange: 400,
    healthMax: 80,
    mana: 60,
    manaMax: 60,
    manaPerTurn: 10,
    manaCostToCast: 20,
    bloodColor: 0x63c572,
  },
  spawnParams: {
    probability: 40,
    budgetCost: 9,
    unavailableUntilLevelIndex: 7,
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
      unit.image.sprite.filters.unshift(
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
                    Unit.takeDamage({
                      unit: attackTarget,
                      amount: unit.damage,
                      sourceUnit: unit,
                      fromVec2: unit,
                    }, underworld, false);
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
      const closestEnemy = Unit.findClosestUnitInDifferentFactionSmartTarget(unit, underworld.units);
      if (closestEnemy) {
        const distanceToEnemy = math.distance(unit, closestEnemy);
        // The following is a hacky way to make them not move too close to the enemy
        unit.stamina = Math.min(unit.stamina, distanceToEnemy - config.COLLISION_MESH_RADIUS);
        await Unit.moveTowards(unit, closestEnemy, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return Unit.livingUnitsInDifferentFaction(unit, underworld.units)
      .filter(u => Unit.inRange(unit, u))
      .sort(math.sortCosestTo(unit))
      .slice(0, numberOfTargets);
  }
};

export default unit;
