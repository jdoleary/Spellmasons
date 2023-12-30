import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import { add, Vec2 } from '../../jmath/Vec';
import Underworld from '../../Underworld';
import { getBestRangedLOSTarget, rangedLOSMovement } from './actions/rangedAction';
import * as config from '../../config';

export const ARCHER_ID = 'archer';
const unit: UnitSource = {
  id: ARCHER_ID,
  info: {
    description: 'archer description',
    image: 'units/archerIdle',
    subtype: UnitSubType.RANGED_LOS,
  },
  unitProps: {
    damage: 10,
    attackRange: 500,
    healthMax: 40,
    manaMax: 0,
  },
  spawnParams: {
    probability: 50,
    budgetCost: 2,
    unavailableUntilLevelIndex: 0,
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
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, _canAttackTarget: boolean) => {
    // Archer just checks attackTarget, not canAttackTarget to know if it can attack because getBestRangedLOSTarget() will return undefined
    // if it can't attack any targets
    const attackTarget = attackTargets && attackTargets[0];
    // Attack
    if (attackTarget) {
      Unit.orient(unit, attackTarget);
      await Unit.playComboAnimation(unit, unit.animations.attack, () => {
        return createVisualFlyingProjectile(
          unit,
          attackTarget,
          'projectile/arrow',
        ).then(() => {
          Unit.takeDamage(attackTarget, unit.damage, unit, underworld, false, undefined, { thinBloodLine: true });
        })

      });
    } else {
      // If it gets to this block it means it is either out of range or cannot see enemy
      await rangedLOSMovement(unit, underworld);
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const targets = getBestRangedLOSTarget(unit, underworld);
    if (targets) {
      // Normal archers can only attack one target;
      return targets.slice(0, 1).map(u => {
        return u;
      });

    } else {
      return [];
    }
  }
};
export default unit;
