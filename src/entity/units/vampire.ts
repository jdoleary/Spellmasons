import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as blood_curse from '../../cards/blood_curse';
import { withinMeleeRange } from './actions/gruntAction';
import Underworld from '../../Underworld';
import { bloodVampire } from '../../graphics/ui/colors';

const unit: UnitSource = {
  id: 'vampire',
  info: {
    description: 'A vampire is infected with Blood Curse.  Anyone with a blood curse get\'s 2x max health but takes heals as pure damage.',
    image: 'units/vampireIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    manaMax: 60,
    healthMax: 7,
    damage: 5,
    bloodColor: bloodVampire
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
  sfx: {
    death: 'vampireDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    Unit.addModifier(unit, blood_curse.id, underworld, false);
  },
  action: async (unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    if (!Unit.canMove(unit)) {
      return;
    }
    if (!attackTarget) {
      // Do not move if they don't have a target
      return;
    }
    // Movement
    await Unit.moveTowards(unit, attackTarget, underworld);

    // Attack closest enemy
    // Note: Special case: don't use canAttackEnemy for melee units
    // because pathing doesn't take immovable units into account yet
    // so it might think it can attack but will be blocked.
    // Instead, just check that the distance is within the attack range
    // and let canAttackEnemy be used for just the attention markers
    if (withinMeleeRange(unit, attackTarget)) {
      await Unit.playAnimation(unit, unit.animations.attack);
      Unit.takeDamage(attackTarget, unit.damage, unit, underworld, false, undefined);
    }
  }
};

export default unit;
