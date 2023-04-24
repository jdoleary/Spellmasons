import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import * as config from '../../config';
import * as Image from '../../graphics/Image';
import { makeAncientParticles } from '../../graphics/ParticleCollection';
import { makeManaTrail } from '../../graphics/Particles';

const unit: UnitSource = {
  id: 'ancient',
  info: {
    description: 'ancient description',
    image: 'units/ancient',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 1200,
    bloodColor: 0x426061,
    healthMax: 60,
    damage: 4,
    manaCostToCast: 15,
    staminaMax: 0,
  },
  spawnParams: {
    probability: 30,
    budgetCost: 5,
    unavailableUntilLevelIndex: 4,
  },
  animations: {
    idle: 'units/ancient',
    hit: 'units/ancient',
    attack: 'units/ancient',
    die: 'units/ancient_dead',
    walk: 'units/ancient',
  },
  sfx: {
    damage: 'ancientHit',
    death: 'ancientDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image) {
      // unit.image.sprite.anchor.y = 0.3;
      unit.image.sprite.scale.x = 0.5;
      unit.image.sprite.scale.y = 0.5;
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    const attackTarget = attackTargets && attackTargets[0];
    // Attack
    if (attackTarget && canAttackTarget) {
      unit.mana -= unit.manaCostToCast;
      // Attack or move, not both; so clear their existing path
      unit.path = undefined;
      Unit.orient(unit, attackTarget);
      makeAncientParticles(unit, false);
      await makeManaTrail(unit, attackTarget, underworld, '#5a7879', '#304748').then(() => {
        Unit.takeDamage(attackTarget, unit.damage, attackTarget, underworld, false, undefined);
      });
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const closestUnit = Unit.findClosestUnitInDifferentFaction(unit, underworld);
    if (closestUnit) {
      return [closestUnit];
    } else {
      return [];
    }
  }
};

export default unit;
