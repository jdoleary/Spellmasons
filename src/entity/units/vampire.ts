import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as blood_curse from '../../cards/blood_curse';
import { meleeAction } from './actions/meleeAction';
import Underworld from '../../Underworld';
import floatingText from '../../graphics/FloatingText';
import * as config from '../../config';
import * as colors from '../../graphics/ui/colors';

export const VAMPIRE_ID = 'vampire';
const unit: UnitSource = {
  id: VAMPIRE_ID,
  info: {
    description: 'vampire_copy',
    image: 'units/vampire/vampireIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    damage: 40,
    healthMax: 80,
    manaMax: 0,
    bloodColor: 0x293a1b,
  },
  spawnParams: {
    probability: 15,
    budgetCost: 6,
    unavailableUntilLevelIndex: 5,
  },
  animations: {
    idle: 'units/vampire/vampireIdle',
    hit: 'units/vampire/vampireHit',
    attack: 'units/vampire/vampireAttack',
    die: 'units/vampire/vampireDeath',
    walk: 'units/vampire/vampireWalk',
  },
  sfx: {
    damage: 'vampireHurt',
    death: 'vampireDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    Unit.addModifier(unit, blood_curse.id, underworld, false);
    //vampire has innate blood curse property, and keeps it on death 
    if (unit.modifiers[blood_curse.id]) {
      unit.modifiers[blood_curse.id].keepOnDeath = true;
    }
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
      Unit.takeDamage({
        unit: attackTarget,
        amount: unit.damage,
        sourceUnit: unit,
        fromVec2: unit,
      }, underworld, false);
    })
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const closestUnit = Unit.findClosestUnitInDifferentFactionSmartTarget(unit, underworld.units);
    if (closestUnit) {
      return [closestUnit];
    } else {
      return [];
    }
  }
};

export default unit;
