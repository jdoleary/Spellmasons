
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { baseRadius, explode } from '../../cards/bloat';

export const urn_explosive_id = 'urn_explosive'
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
        damage: 0,
    },
    spawnParams: {
        probability: 0,
        budgetCost: 0,
        unavailableUntilLevelIndex: 0,
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
        death: 'bloatExplosion'
    },
    init: (unit: Unit.IUnit, underworld: Underworld) => {
        unit.onDeathEvents.push('urnexplosiveExplode');
    },
    action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    },
    getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
        return [];
    }
};
export const urnexplosiveExplode = 'urnexplosiveExplode';
const damage = 80;
export function registerUrnexplosiveExplode() {
    registerEvents(urnexplosiveExplode, {
        onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
            explode(unit, unit.attackRange, damage, prediction, underworld);
            // Remove corpse
            // Note: This must be called after all other explode logic or else it will affect the position
            // of the explosion
            Unit.cleanup(unit);
        }
    });
}

export default unit;
