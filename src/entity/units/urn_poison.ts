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
    image: 'doodads/urn_poison',
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
    idle: 'doodads/urn_poison',
    hit: 'doodads/urn_poison',
    attack: 'doodads/urn_poison',
    die: 'doodads/urn_poison',
    walk: 'doodads/urn_poison',
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
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const units = explode(unit, unit.attackRange, 0, 0,
        unit,
        underworld, prediction,
        0x164a15, 0x6bff77);

      units.filter(u => u.alive)
        .forEach(u => {
          if (!prediction) {
            animateSpell(u, 'spell-effects/spellPoison'); // TODO - Put in poison modifier "add" function?
          }
          Unit.addModifier(u, poison.poisonCardId, underworld, prediction, 1);
        });
      // Remove corpse
      if (!prediction) {
        Unit.cleanup(unit, true);
      }
    }
  });
}

export default urnPoisonSource;