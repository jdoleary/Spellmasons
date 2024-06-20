import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { baseExplosionRadius, explode } from '../../effects/explode';
import * as freeze from '../../cards/freeze';

export const urn_ice_id = 'Ice Urn'
const unit: UnitSource = {
  id: urn_ice_id,
  info: {
    description: 'urn ice description',
    image: 'doodads/urn_ice',
    subtype: UnitSubType.DOODAD,
  },
  unitProps: {
    damage: 0,
    attackRange: baseExplosionRadius,
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
    idle: 'doodads/urn_ice',
    hit: 'doodads/urn_ice',
    attack: 'doodads/urn_ice',
    die: 'doodads/urn_ice',
    walk: 'doodads/urn_ice',
  },
  sfx: {
    damage: '',
    death: ''
  },
  // Warning: init must be idempotent
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    Unit.addEvent(unit, urnIceExplode);
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return [];
  }
};
export const urnIceExplode = 'urnIceExplode';
export function registerUrnIceExplode() {
  registerEvents(urnIceExplode, {
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const units = explode(unit, unit.attackRange, 0, 0,
        unit,
        underworld, prediction,
        0x002c6e, 0x59deff);

      units.filter(u => u.alive)
        .forEach(u => {
          Unit.addModifier(u, freeze.freezeCardId, underworld, prediction, 1);
        });

      // Remove corpse
      if (!prediction) {
        Unit.cleanup(unit, true);
      }
    }
  });
}

export default unit;