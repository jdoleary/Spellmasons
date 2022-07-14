import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as vampire_bite from '../../cards/vampire_bite';
import { withinMeleeRange } from './actions/gruntAction';

const unit: UnitSource = {
  id: 'vampire',
  info: {
    description: 'A vampire takes half damage when hurt, but takes all heals as pure damage.  Beware that it doesn\'t get close enough to bite you or you too will become a vampire!',
    image: 'units/vampireIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    manaMax: 60,
    healthMax: 18,
    damage: 5
  },
  spawnParams: {
    probability: 15,
    unavailableUntilLevelIndex: 5,
  },
  animations: {
    idle: 'units/vampireIdle',
    hit: 'units/vampireHit',
    attack: 'units/vampireAttack',
    die: 'units/vampireDeath',
    walk: 'units/vampireWalk',
  },
  init: (unit: Unit.IUnit) => {
    Unit.addModifier(unit, vampire_bite.id);
  },
  action: async (unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, canAttackTarget: boolean) => {
    if (!Unit.canMove(unit)) {
      return;
    }
    if (!attackTarget) {
      // Do not move if they don't have a target
      return;
    }
    // Movement
    await Unit.moveTowards(unit, attackTarget);

    // Attack closest enemy
    // Note: Special case: don't use canAttackEnemy for melee units
    // because pathing doesn't take immovable units into account yet
    // so it might think it can attack but will be blocked.
    // Instead, just check that the distance is within the attack range
    // and let canAttackEnemy be used for just the attention markers
    if (withinMeleeRange(unit, attackTarget)) {
      await Unit.playAnimation(unit, unit.animations.attack);
      Unit.takeDamage(attackTarget, unit.damage, false, undefined);
      Unit.addModifier(attackTarget, vampire_bite.id);
    }
  }
};

export default unit;
