import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import * as math from '../../jmath/math';
import { Vec2 } from '../../jmath/Vec';
import Underworld from '../../Underworld';
import { getBestRangedLOSTarget, rangedLOSMovement } from './actions/rangedAction';

const NUMBER_OF_UNITS_BLOOD_ARCHER_CAN_ATTACK = 3;
const NUMBER_OF_UNITS_MINIBOSS_BLOOD_ARCHER_CAN_ATTACK = 6;
export const BLOOD_ARCHER_ID = 'Blood Archer';
const unit: UnitSource = {
  id: BLOOD_ARCHER_ID,
  info: {
    description: ['blood_archer_copy', NUMBER_OF_UNITS_BLOOD_ARCHER_CAN_ATTACK.toString(), NUMBER_OF_UNITS_MINIBOSS_BLOOD_ARCHER_CAN_ATTACK.toString()],
    image: 'units/archerIdle',
    subtype: UnitSubType.RANGED_LOS,
  },
  unitProps: {
    damage: 40,
    attackRange: 600,
    healthMax: 80,
    manaMax: 0,
    bloodColor: 0x324860,
  },
  spawnParams: {
    probability: 50,
    budgetCost: 5,
    unavailableUntilLevelIndex: 6,
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
      unit.image.sprite.filters.unshift(
        new MultiColorReplaceFilter(
          [
            [0x3fc7c2, 0xc73f53], // feathers 
            [0x7c5353, 0x53667c], //skinMedium
            [0x866262, 0x627386], //skinLight
            [0x603232, 0x324860], //skinDark
            [0x838d9f, 0x802230], //loin cloth
          ],
          0.15
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, _canAttackTarget: boolean) => {
    // Archer just checks attackTarget, not canAttackTarget to know if it can attack because getBestRangedLOSTarget() will return undefined
    // if it can't attack any targets
    // Attack
    if (attackTargets && attackTargets[0]) {
      Unit.orient(unit, attackTargets[0]);
      await Unit.playComboAnimation(unit, unit.animations.attack, () => {
        let flyingProjectilePromise = Promise.resolve();
        for (let target of attackTargets) {
          flyingProjectilePromise = createVisualFlyingProjectile(
            unit,
            target,
            'projectile/arrow',
          ).then(() => {
            Unit.takeDamage({
              unit: target,
              amount: unit.damage,
              sourceUnit: unit,
              fromVec2: unit,
              thinBloodLine: true
            }, underworld, false);
          });
        }
        return flyingProjectilePromise;
      });
    } else {
      // If it gets to this block it means it is either out of range or cannot see enemy
      await rangedLOSMovement(unit, underworld);
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return getBestRangedLOSTarget(unit, underworld).slice(0, unit.isMiniboss ? NUMBER_OF_UNITS_MINIBOSS_BLOOD_ARCHER_CAN_ATTACK : NUMBER_OF_UNITS_BLOOD_ARCHER_CAN_ATTACK);
  }
};
export default unit;
