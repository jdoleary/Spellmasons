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
    image: 'doodads/urn_explosive',
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
    idle: 'doodads/urn_explosive',
    hit: 'doodads/urn_explosive',
    attack: 'doodads/urn_explosive',
    die: 'doodads/urn_explosive',
    walk: 'doodads/urn_explosive',
  },
  sfx: {
    damage: '',
    death: ''
  },
  // Warning: init must be idempotent
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (!unit.onDeathEvents.includes(urnexplosiveExplode)) {
      unit.onDeathEvents.push(urnexplosiveExplode);
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return [];
  }
};
export const urnexplosiveExplode = 'urnexplosiveExplode';
export function registerUrnexplosiveExplode() {
  registerEvents(urnexplosiveExplode, {
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      explode(unit, unit.attackRange, unit.damage, defaultPushDistance,
        underworld, prediction,
        colors.bloatExplodeStart, colors.bloatExplodeEnd);
      // Remove corpse
      if (!prediction) {
        Unit.cleanup(unit, false);
      }
    }
  });
}

export default unit;