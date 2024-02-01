import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { meleeAction } from './actions/meleeAction';
import * as config from '../../config'
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { explode } from '../../effects/explode';
import * as colors from '../../graphics/ui/colors';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { poisonCardId } from '../../cards/poison';
import { debilitateCardId } from '../../cards/debilitate';
import { freezeCardId } from '../../cards/freeze';
import { randInt } from '../../jmath/rand';
import { registerEvents } from '../../cards';

export const banelingUnitId = 'baneling'
const explosionRadius = 100;
const pushDist = 0;
const unit: UnitSource = {
  id: banelingUnitId,
  info: {
    description: 'vampire_copy',
    image: 'units/vampireIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    damage: 20,
    staminaMax: config.UNIT_BASE_STAMINA / 2,
    healthMax: 10,
    manaMax: 0,
  },
  spawnParams: {
    probability: 100,
    budgetCost: 1,
    unavailableUntilLevelIndex: 0,
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
    const debuffs = [poisonCardId, debilitateCardId, freezeCardId];
    // @ts-ignore baneling logic
    unit.debuff = debuffs[randInt(0, debuffs.length - 1)];
    if (!unit.onDeathEvents.includes(banelingExplode)) {
      unit.onDeathEvents.push(banelingExplode);
    }
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.scale.x *= 0.5;
      unit.image.sprite.scale.y *= 0.5;
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
      await Unit.playAnimation(unit, unit.animations.attack);
      Unit.die(unit, underworld, false);
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
export const banelingExplode = 'banelingExplode';
export function registerBanelingExplode() {
  registerEvents(banelingExplode, {
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      // Explode and apply debuff
      const units = explode(unit, explosionRadius, unit.damage, pushDist, underworld, prediction,
        colors.trueRed.toString(), colors.trueBlack.toString());
      units.filter(u => u.alive).forEach(u =>
        // @ts-ignore baneling logic
        Unit.addModifier(u, unit.debuff, underworld, prediction));

      // Banelings don't leave a corpse
      if (!prediction) {
        Unit.cleanup(unit, false);
      }
    }
  });
}

export default unit;
