import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as blood_curse from '../../cards/blood_curse';
import { meleeAction } from './actions/meleeAction';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import Underworld from '../../Underworld';
import floatingText from '../../graphics/FloatingText';
import * as config from '../../config';
import * as colors from '../../graphics/ui/colors';

export const VAMPIRE_ID = 'vampire';
const unit: UnitSource = {
  id: VAMPIRE_ID,
  info: {
    description: 'vampire_copy',
    image: 'units/vampireIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    damage: 50,
    healthMax: 70,
    manaMax: 0,
    bloodColor: 0x293a1b,
  },
  spawnParams: {
    probability: 20,
    budgetCost: 5,
    unavailableUntilLevelIndex: 3,
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
    // vampires have innate blood curse property, and keep it on death 
    if (unit.modifiers[blood_curse.id]) {
      unit.modifiers[blood_curse.id].keepOnDeath = true;
    }
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.push(
        new MultiColorReplaceFilter(
          [
            [0x0c456f, 0x563d2a], // rear foot
            [0x6896d1, 0xb98553], // skin light
            [0x5280bc, 0xa37242], // skin medium
            [0x3767a4, 0x815933], // skin dark / foot
            [0x0c456f, 0xff371f], // skin darkest
            [0xf1fa68, 0x293a1b], // bubbles
            [0x42d9d3, 0x513c20], // mouth
            [0x2280cf, 0x96683c], // foot
            [0x1969bd, 0x7c5631], // foot outline
          ],
          0.1
        )
      );
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
