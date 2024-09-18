import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import * as colors from '../../graphics/ui/colors';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { explode } from '../../effects/explode';
import { defaultPushDistance } from '../../effects/force_move';

export const urn_explosive_id = 'Explosive Urn'
const baseRadius = 140;
const damage = 80;
const unit: UnitSource = {
  id: urn_explosive_id,
  info: {
    description: 'urn explosive description',
    image: 'urn_explosive',
    subtype: UnitSubType.DOODAD,
  },
  unitProps: {
    damage,
    attackRange: baseRadius,
    staminaMax: 0,
    healthMax: 1,
    manaMax: 0,
  },
  spawnParams: {
    probability: 0,
    budgetCost: 0,
    unavailableUntilLevelIndex: 0,
    excludeMiniboss: true,
  },
  animations: {
    idle: 'urn_explosive',
    hit: 'urn_explosive',
    attack: 'urn_explosive',
    die: 'urn_explosive',
    walk: 'urn_explosive',
  },
  sfx: {
    damage: '',
    death: ''
  },
  // Warning: init must be idempotent
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    Unit.addEvent(unit, urnexplosiveExplode);
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return [];
  }
};
export const urnexplosiveExplode = 'urnexplosiveExplode';
export function registerUrnExplosiveExplode() {
  registerEvents(urnexplosiveExplode, {
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, sourceUnit?: Unit.IUnit) => {
      // The sourceunit is considered to be the unit that killed the urn, rather than the urn itself
      // This allows players to trigger events such as onDamage/onKill through urn explosions
      explode(unit, unit.attackRange, unit.damage, defaultPushDistance,
        sourceUnit,
        underworld, prediction,
        colors.bloatExplodeStart, colors.bloatExplodeEnd);
      // Remove corpse
      if (!prediction) {
        Unit.cleanup(unit, true);
      }
    }
  });
}

export default unit;