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
    image: 'urn_ice',
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
    idle: 'urn_ice',
    hit: 'urn_ice',
    attack: 'urn_ice',
    die: 'urn_ice',
    walk: 'urn_ice',
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
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, sourceUnit?: Unit.IUnit) => {
      // The sourceunit is considered to be the unit that killed the urn, rather than the urn itself
      // This allows players to trigger events such as onDamage/onKill through urn explosions
      const units = explode(unit, unit.attackRange, 0, 0,
        sourceUnit,
        underworld, prediction,
        0x002c6e, 0x59deff);

      // Urn adds freeze to each unit in the explosion radius
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