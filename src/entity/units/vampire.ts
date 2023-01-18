import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as blood_curse from '../../cards/blood_curse';
import { meleeAction } from './actions/meleeAction';
import Underworld from '../../Underworld';
import { bloodVampire } from '../../graphics/ui/colors';
import floatingText from '../../graphics/FloatingText';
import * as config from '../../config';
import * as colors from '../../graphics/ui/colors';

const unit: UnitSource = {
  id: 'vampire',
  info: {
    description: 'vampire_copy',
    image: 'units/vampireIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    manaMax: 60,
    healthMax: 70,
    damage: 50,
    bloodColor: bloodVampire
  },
  spawnParams: {
    probability: 15,
    budgetCost: 5,
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
    damage: 'vampireHurt',
    death: 'vampireDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    Unit.addModifier(unit, blood_curse.id, underworld, false);
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    await meleeAction(unit, attackTargets, underworld, canAttackTarget, async (attackTarget: Unit.IUnit) => {
      playSFXKey('vampireAttack');
      await Unit.playAnimation(unit, unit.animations.attack);
      // prediction is false because unit.action doesn't yet ever occur during a prediction
      if (globalThis.player && attackTarget == globalThis.player.unit) {
        floatingText({
          coords: attackTarget,
          text: blood_curse.id,
          style: { fill: colors.healthRed, fontSize: '50px', ...config.PIXI_TEXT_DROP_SHADOW }
        })
      }
      Unit.addModifier(attackTarget, blood_curse.id, underworld, false);
      Unit.takeDamage(attackTarget, unit.damage, unit, underworld, false, undefined);
    })
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
