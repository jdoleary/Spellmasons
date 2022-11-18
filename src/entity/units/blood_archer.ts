import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import * as math from '../../jmath/math';
import { Vec2 } from '../../jmath/Vec';
import Underworld from '../../Underworld';

const unit: UnitSource = {
  id: 'blood_archer',
  info: {
    description: 'An archer will try to get close enough to shoot you but not much closer.  It can only shoot you if there aren\'t any walls between you both.',
    image: 'units/archerIdle',
    subtype: UnitSubType.RANGED_LOS,
  },
  unitProps: {
    attackRange: 600,
    manaMax: 0,
    damage: 4,
    healthMax: 8,
    bloodColor: 0x324860
  },
  spawnParams: {
    probability: 50,
    unavailableUntilLevelIndex: 5,
  },
  animations: {
    idle: 'units/archerIdle',
    hit: 'units/archerHit',
    attack: 'units/archerAttack',
    die: 'units/archerDeath',
    walk: 'units/archerWalk',
  },
  sfx: {
    damage: 'archerHurt',
    death: 'archerDeath',
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.push(
        // @ts-ignore for some reason ts is flagging this as an error but it works fine
        // in pixi.
        new MultiColorReplaceFilter(
          [
            [0x3fc7c2, 0xc73f53], // feathers 
            // [0x3fc7c2, 0xc7823f], // orange feathers 
            [0x866262, 0x627386], //skinLight
            // [0x7c5353, 0x53667c], //skinMedium
            [0x603232, 0x324860], //skinDark
            [0x838d9f, 0x802230], //loin cloth
          ],
          0.1
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, underworld: Underworld, _canAttackTarget: boolean) => {
    // Archer just checks attackTarget, not canAttackTarget to know if it can attack because getBestRangedLOSTarget() will return undefined
    // if it can't attack any targets
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
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
          Unit.takeDamage(attackTarget, unit.damage, unit, underworld, false, undefined, { thinBloodLine: true });
        });

      });
    } else {
      // Movement:
      // Intelligently move the archer to a position where it can see the enemy
      if (closestEnemy) {
        const moveOptions = Unit.findLOSLocation(unit, closestEnemy, underworld);
        const moveChoice = moveOptions.reduce<{ dist: number, pos: Vec2 | undefined }>((closest, cur) => {
          const dist = math.distance(cur, unit);
          if (dist < closest.dist) {
            return { dist, pos: cur }
          } else {
            return closest
          }
        }, { dist: Number.MAX_SAFE_INTEGER, pos: undefined })

        if (moveChoice.pos) {
          await Unit.moveTowards(unit, moveChoice.pos, underworld);
        } else {
          // Move closer
          await Unit.moveTowards(unit, closestEnemy, underworld);
        }
      }
    }
  },
};
export default unit;
