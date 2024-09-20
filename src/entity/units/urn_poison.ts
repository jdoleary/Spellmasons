import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { baseExplosionRadius, explode } from '../../effects/explode';
import * as poison from '../../cards/poison';
import { animateSpell } from '../../cards/cardUtils';

export const urn_poison_id = 'Toxic Urn'
const urnPoisonSource: UnitSource = {
  id: urn_poison_id,
  info: {
    description: 'urn poison description',
    image: 'urn_poison',
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
    idle: 'urn_poison',
    hit: 'urn_poison',
    attack: 'urn_poison',
    die: 'urn_poison',
    walk: 'urn_poison',
  },
  sfx: {
    damage: '',
    death: ''
  },
  // Warning: init must be idempotent
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    Unit.addEvent(unit, urnpoisonExplode);
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return [];
  }
};
export const urnpoisonExplode = 'urnpoisonExplode';
export function registerUrnPoisonExplode() {
  registerEvents(urnpoisonExplode, {
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, sourceUnit?: Unit.IUnit) => {
      // The sourceunit is considered to be the unit that killed the urn, rather than the urn itself
      // This allows players to trigger events such as onDamage/onKill through urn explosions
      const units = explode(unit, unit.attackRange, 0, 0,
        unit,
        underworld, prediction,
        0x164a15, 0x6bff77);

      // Urn adds poison to each unit in the explosion raidus
      units.filter(u => u.alive)
        .forEach(u => {
          if (!prediction) {
            animateSpell(u, 'spellPoison');
          }
          // The source of the poison is considered to be the unit that killed the urn
          // Poison modifier takes in a sourceUnit ID, so convert here
          Unit.addModifier(u, poison.poisonCardId, underworld, prediction, 20, { sourceUnitId: sourceUnit?.id });
        });
      // Remove corpse
      if (!prediction) {
        Unit.cleanup(unit, true);
      }
    }
  });
}

export default urnPoisonSource;