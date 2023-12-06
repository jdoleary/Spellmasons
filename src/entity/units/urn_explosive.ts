
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { baseRadius, explode } from '../../cards/bloat';

export const urn_explosive_id = 'Explosive Urn'
const damage = 80;
const unit: UnitSource = {
    id: urn_explosive_id,
    info: {
        description: 'urn explosive description',
        image: 'doodads/urn_explosive',
        subtype: UnitSubType.DOODAD,
    },
    unitProps: {
        staminaMax: 0,
        attackRange: baseRadius,
        manaMax: 0,
        healthMax: 1,
        damage,
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
        if (!unit.onDamageEvents.includes(urnexplosiveExplode)) {
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
            explode(unit, unit.attackRange, unit.damage, prediction, underworld);
            // Remove corpse
            Unit.cleanup(unit, true);
        }
    });
}

export default unit;
