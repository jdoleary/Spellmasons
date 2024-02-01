import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as blood_curse from '../../cards/blood_curse';
import { meleeAction, meleeTryAttackClosestEnemy, withinMeleeRange } from './actions/meleeAction';
import Underworld from '../../Underworld';
import { bloodVampire } from '../../graphics/ui/colors';
import floatingText from '../../graphics/FloatingText';
import { healUnit } from '../../effects/heal';

const manaToSteal = 40;
export const MANA_VAMPIRE_ID = 'Mana Vampire';
const unit: UnitSource = {
  id: MANA_VAMPIRE_ID,
  info: {
    description: 'mana_vampire_copy',
    image: 'units/vampireIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    damage: 40,
    healthMax: 120,
    mana: 40,
    manaMax: 120,
    manaPerTurn: 0,
    manaCostToCast: 0,
    bloodColor: bloodVampire,
  },
  spawnParams: {
    probability: 15,
    budgetCost: 9,
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
      if (attackTarget.mana) {
        const manaStolen = Math.min(attackTarget.mana, manaToSteal);
        attackTarget.mana -= manaStolen;
        unit.mana += manaStolen;
        unit.mana = Math.min(unit.mana, unit.manaMax);
        floatingText({ coords: attackTarget, text: `${manaStolen} mana stolen.` });
        if (attackTarget.unitType == UnitType.PLAYER_CONTROLLED) {
          // Update mana bar UI
          underworld.syncPlayerPredictionUnitOnly();
          Unit.syncPlayerHealthManaUI(underworld);
        }
      }
    })
    // Will restore up to 40 missing hp if the unit has mana to do so
    const healthToRestore = Math.min(40, unit.mana, unit.healthMax - unit.health);
    if (healthToRestore > 0) {
      unit.mana -= healthToRestore;
      await healUnit(unit, healthToRestore, underworld, false);
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    // Maybe the mana vampire should prioritize units with more mana?
    const closestUnit = Unit.findClosestUnitInDifferentFaction(unit, underworld);
    if (closestUnit) {
      return [closestUnit];
    } else {
      return [];
    }
  }
};

export default unit;
