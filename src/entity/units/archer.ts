import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import { addPixiSpriteAnimated, containerSpells } from '../../graphics/PixiUtils';
import { Vec2 } from '../../jmath/Vec';
import Underworld from '../../Underworld';

const unit: UnitSource = {
  id: 'archer',
  info: {
    description: 'An archer will try to get close enough to shoot you but not much closer.  It can only shoot you if there aren\'t any walls between you both.',
    image: 'units/archerIdle',
    subtype: UnitSubType.RANGED_LOS,
  },
  unitProps: {
    attackRange: 10000,
    manaMax: 0,
  },
  spawnParams: {
    probability: 50,
    unavailableUntilLevelIndex: 1,
  },
  animations: {
    idle: 'units/archerIdle',
    hit: 'units/archerHit',
    attack: 'units/archerAttack',
    die: 'units/archerDeath',
    walk: 'units/archerWalk',
  },
  action: async (unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, underworld: Underworld, _canAttackTarget: boolean) => {
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    // Attack
    if (attackTarget) {
      // Archers attack or move, not both; so clear their existing path
      unit.path = undefined;
      Unit.orient(unit, attackTarget);
      await Unit.playComboAnimation(unit, unit.animations.attack, () => {
        return createVisualFlyingProjectile(
          unit,
          attackTarget,
          'projectile/arrow',
        ).then(() => {
          Unit.takeDamage(attackTarget, unit.damage, underworld, false, undefined);
          // Add projectile hit animation
          const animationSprite = addPixiSpriteAnimated('projectile/arrowProjectileHit', containerSpells, {
            loop: false,
            animationSpeed: 0.2,
            onComplete: () => {
              if (animationSprite?.parent) {
                animationSprite.parent.removeChild(animationSprite)
              } else {
                console.error('Expected archer animationSprite to have parent so it could be removed but it did not.')
              }
            }
          });
          if (animationSprite) {
            animationSprite.anchor.set(0, 0.5);
            animationSprite.x = attackTarget.x;
            animationSprite.y = attackTarget.y;
          }

        })

      });
    } else {
      // Movement:
      // Intelligently move the archer to a position where it can see the enemy
      if (closestEnemy) {
        const moveOptions = Unit.findLOSLocation(unit, closestEnemy);
        const moveChoice = moveOptions.reduce<{ dist: number, pos: Vec2 | undefined }>((closest, cur) => {
          const dist = math.distance(cur, unit);
          if (dist < closest.dist) {
            return { dist, pos: cur }
          } else {
            return closest
          }
        }, { dist: Number.MAX_SAFE_INTEGER, pos: undefined })

        if (moveChoice.pos) {
          await Unit.moveTowards(unit, moveChoice.pos);
        } else {
          // Move closer
          await Unit.moveTowards(unit, closestEnemy);
        }
      }
    }
  },
};
export default unit;
