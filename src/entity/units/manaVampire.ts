import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as blood_curse from '../../cards/blood_curse';
import { meleeAction, meleeTryAttackClosestEnemy, withinMeleeRange } from './actions/meleeAction';
import Underworld from '../../Underworld';
import { bloodVampire } from '../../graphics/ui/colors';
import floatingText from '../../graphics/FloatingText';

const mana_proportion_removal_amount = 0.1;
const unit: UnitSource = {
  id: 'Mana Vampire',
  info: {
    description: 'mana_vampire_copy',
    image: 'units/vampireIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    manaMax: 0,
    healthMax: 120,
    damage: 50,
    bloodColor: bloodVampire
  },
  spawnParams: {
    probability: 15,
    budgetCost: 8,
    unavailableUntilLevelIndex: 7,
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
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    await meleeAction(unit, attackTargets, underworld, canAttackTarget, async (attackTarget: Unit.IUnit) => {
      playSFXKey('vampireAttack');
      await Unit.playAnimation(unit, unit.animations.attack);
      Unit.takeDamage(attackTarget, unit.damage, unit, underworld, false, undefined);
      if (attackTarget.manaMax) {
        attackTarget.manaMax *= (1.0 - mana_proportion_removal_amount);
        attackTarget.manaMax = Math.floor(attackTarget.manaMax);
        attackTarget.mana = Math.min(attackTarget.mana, attackTarget.manaMax);
        floatingText({ coords: attackTarget, text: `${Math.floor(mana_proportion_removal_amount * 100)}% maximum mana removed.` });
        if (attackTarget.unitType == UnitType.PLAYER_CONTROLLED) {
          // Update mana bar UI
          underworld.syncPlayerPredictionUnitOnly();
          const playerPredictionUnit = underworld.unitsPrediction.find(u => u.id == globalThis.player?.unit.id)
          if (playerPredictionUnit) {
            Unit.syncPlayerHealthManaUI(underworld, playerPredictionUnit);
          }

        }
      }
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
